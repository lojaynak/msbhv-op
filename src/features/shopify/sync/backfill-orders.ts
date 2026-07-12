import { shopifyGraphQL } from "@/lib/shopify/graphql-client";
import {
  BACKFILL_ORDERS_QUERY,
  type BackfillOrderNode,
  type BackfillOrdersResponse,
} from "@/lib/shopify/backfill-orders-query";
import type { ShopifyOrderPayload } from "@/lib/shopify/types";
import { upsertShopifyOrder } from "./upsert-order";
import { recordIntegrationError, recordIntegrationSuccess } from "@/lib/integrations/health";
import { retryOnTransientAuthError } from "@/lib/utils/retry";

// GraphQL's displayFulfillmentStatus values -> the lowercase REST-style
// values mapShopifyOrderStatus() already knows how to read (see status-map.ts).
function toRestFulfillmentStatus(graphqlStatus: string): string | null {
  switch (graphqlStatus) {
    case "FULFILLED":
      return "fulfilled";
    case "PARTIALLY_FULFILLED":
      return "partial";
    default:
      return null; // UNFULFILLED and everything else reads as "brand new"
  }
}

function transformNode(node: BackfillOrderNode): ShopifyOrderPayload {
  return {
    id: Number(node.legacyResourceId),
    name: node.name,
    order_number: Number(node.legacyResourceId), // unused by upsertShopifyOrder, kept for type shape only
    email: node.email,
    phone: node.phone,
    financial_status: null, // not used by our status mapping — see status-map.ts
    fulfillment_status: toRestFulfillmentStatus(node.displayFulfillmentStatus),
    cancelled_at: node.cancelledAt,
    subtotal_price: node.subtotalPriceSet.shopMoney.amount,
    total_discounts: node.totalDiscountsSet.shopMoney.amount,
    total_shipping_price_set: { shop_money: { amount: node.totalShippingPriceSet.shopMoney.amount } },
    total_price: node.totalPriceSet.shopMoney.amount,
    customer: node.customer
      ? {
          id: Number(node.customer.legacyResourceId),
          first_name: node.customer.firstName,
          last_name: node.customer.lastName,
          email: node.customer.email,
          phone: node.customer.phone,
          default_address: node.customer.defaultAddress,
        }
      : null,
    shipping_address: node.shippingAddress,
    line_items: node.lineItems.nodes.map((li) => ({
      id: 0, // Shopify's line-item id isn't stored separately in our schema
      product_id: li.product ? Number(li.product.legacyResourceId) : null,
      variant_id: li.variant ? Number(li.variant.legacyResourceId) : null,
      sku: li.sku,
      title: li.title,
      variant_title: li.variantTitle,
      quantity: li.quantity,
      price: li.originalUnitPriceSet.shopMoney.amount,
    })),
    created_at: node.createdAt,
  };
}

export type BackfillPageResult = {
  imported: number;
  failed: number;
  errors: string[];
  hasMore: boolean;
  nextCursor: string | null;
};

/**
 * Processes exactly ONE page (3 orders) per call and returns immediately —
 * deliberately, not a full backfill loop. Vercel's serverless functions
 * have a hard execution time limit (10-60s depending on plan), and a
 * single request handling hundreds of orders (each needing several
 * sequential Supabase round-trips via upsertShopifyOrder) can exceed that
 * and get killed mid-request by the platform itself — which returns its
 * own error page instead of a JSON response, breaking the caller.
 *
 * The route handler (and the Settings UI button) calls this repeatedly,
 * once per page, following `nextCursor` until `hasMore` is false. Each
 * individual call stays small and fast regardless of total order volume.
 * Reuses upsertShopifyOrder() so backfilled orders go through the exact
 * same logic as live webhooks — safe to run after webhooks are live, and
 * safe to re-run or resume after an interruption (upserts, not inserts).
 */
export async function backfillShopifyOrdersPage(cursor: string | null): Promise<BackfillPageResult> {
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const data: BackfillOrdersResponse = await shopifyGraphQL<BackfillOrdersResponse>(
      BACKFILL_ORDERS_QUERY,
      { cursor },
    );

    for (const node of data.orders.nodes) {
      try {
        await retryOnTransientAuthError(() => upsertShopifyOrder(transformNode(node)));
        imported++;
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${node.name}: ${message}`);
      }
    }

    await recordIntegrationSuccess("shopify");
    return {
      imported,
      failed,
      errors,
      hasMore: data.orders.pageInfo.hasNextPage,
      nextCursor: data.orders.pageInfo.endCursor,
    };
  } catch (error) {
    await recordIntegrationError("shopify", error);
    throw error;
  }
}
