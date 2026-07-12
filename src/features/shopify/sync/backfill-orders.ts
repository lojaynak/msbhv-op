import { shopifyGraphQL } from "@/lib/shopify/graphql-client";
import {
  BACKFILL_ORDERS_QUERY,
  type BackfillOrderNode,
  type BackfillOrdersResponse,
} from "@/lib/shopify/backfill-orders-query";
import type { ShopifyOrderPayload } from "@/lib/shopify/types";
import { upsertShopifyOrder } from "./upsert-order";
import { recordIntegrationError, recordIntegrationSuccess } from "@/lib/integrations/health";

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

export type BackfillResult = {
  imported: number;
  failed: number;
  errors: string[];
  reachedPageCap: boolean;
};

// Safety cap so one click can't run indefinitely / risk a serverless
// timeout on a store with an unexpectedly large 60-day order volume.
// 25/page * 40 pages = up to 1000 orders per run — click again to continue
// if a store genuinely has more than that in the window.
const MAX_PAGES = 40;

/**
 * One-time (but safely re-runnable) backfill of whatever order history
 * Shopify's API will return without the read_all_orders scope — see the
 * query file for why that's a hard 60-day-ish platform limit, not a bug
 * here. Reuses upsertShopifyOrder() so backfilled orders go through the
 * exact same customer/product/order_items logic as live webhooks — same
 * upsert-by-shopify-id behavior, so running this after webhooks are
 * already live is safe and won't create duplicates.
 */
export async function backfillShopifyOrders(): Promise<BackfillResult> {
  let cursor: string | null = null;
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];
  let page = 0;

  try {
    while (page < MAX_PAGES) {
      page++;
      const data: BackfillOrdersResponse = await shopifyGraphQL<BackfillOrdersResponse>(
        BACKFILL_ORDERS_QUERY,
        { cursor },
      );

      for (const node of data.orders.nodes) {
        try {
          await upsertShopifyOrder(transformNode(node));
          imported++;
        } catch (error) {
          failed++;
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`${node.name}: ${message}`);
        }
      }

      if (!data.orders.pageInfo.hasNextPage) {
        await recordIntegrationSuccess("shopify");
        return { imported, failed, errors, reachedPageCap: false };
      }
      cursor = data.orders.pageInfo.endCursor;
    }

    await recordIntegrationSuccess("shopify");
    return { imported, failed, errors, reachedPageCap: true };
  } catch (error) {
    await recordIntegrationError("shopify", error);
    throw error;
  }
}
