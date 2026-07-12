import { createAdminClient } from "@/lib/supabase/admin";
import type { ShopifyOrderPayload } from "@/lib/shopify/types";
import { mapShopifyOrderStatus } from "@/lib/shopify/status-map";
import { upsertCustomerFromOrder, upsertGuestCustomerFromOrder } from "./upsert-customer";
import { upsertProductVariantStub } from "./upsert-product-stub";

/**
 * Handles orders/create, orders/updated, and orders/cancelled — all three
 * webhook topics send the same payload shape, so one function covers all
 * of them. Upserts by `shopify_order_id`, so replays/retries (Shopify
 * webhooks are "at least once", never guaranteed exactly-once) are safe.
 */
export async function upsertShopifyOrder(payload: ShopifyOrderPayload): Promise<void> {
  const supabase = createAdminClient();

  // Most orders have a full Shopify customer profile. Guest checkouts and
  // manually-created draft orders (e.g. testing by marking a draft as
  // paid, with no customer picked) don't — those fall back to matching by
  // phone/email instead of a Shopify customer ID. See upsert-customer.ts.
  const customerId = payload.customer
    ? await upsertCustomerFromOrder(payload.customer, payload.shipping_address)
    : await upsertGuestCustomerFromOrder({
        email: payload.email,
        phone: payload.phone,
        shippingAddress: payload.shipping_address,
      });

  if (!customerId) {
    // Genuinely no identifying info at all (no customer, no email, no
    // phone anywhere on the order) — nothing to attach a customer to.
    // Rare in practice; visible here rather than silently vanishing.
    throw new Error(
      `Order ${payload.name} (id ${payload.id}) has no customer, email, or phone anywhere ` +
        `in its payload — nothing to match or create a customer record from.`,
    );
  }

  const status = mapShopifyOrderStatus({
    cancelledAt: payload.cancelled_at,
    fulfillmentStatus: payload.fulfillment_status,
  });

  const shippingTotal = Number(payload.total_shipping_price_set?.shop_money.amount ?? 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .upsert(
      {
        shopify_order_id: String(payload.id),
        order_number: payload.name,
        customer_id: customerId,
        status,
        payment_method: "card", // Shopify orders are card/wallet by default; COD orders are flagged separately if you use a COD payment gateway app — revisit if needed
        subtotal: Number(payload.subtotal_price),
        shipping_fee: shippingTotal,
        discount: Number(payload.total_discounts),
        total: Number(payload.total_price),
        source: "shopify",
        // The order's REAL creation date in Shopify — not sync time. This
        // matters a lot for backfilled orders (which sync well after the
        // fact) and for anything date-filtered, like "Today's Orders".
        created_at: payload.created_at,
      },
      { onConflict: "shopify_order_id" },
    )
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(`upsertShopifyOrder failed: ${orderError?.message}`);
  }

  // Replace order_items wholesale on every sync — simpler and safer than
  // diffing line-item changes, and orders rarely have enough items for this
  // to be a real cost.
  await supabase.from("order_items").delete().eq("order_id", order.id);

  // Line items are independent of each other — process them concurrently
  // instead of one at a time. This is the single biggest speedup available
  // here: each item needs 2-3 sequential writes internally (product,
  // variant, inventory), and running items in parallel means that cost is
  // paid once per order instead of once per item.
  const variantIds = await Promise.all(payload.line_items.map((item) => upsertProductVariantStub(item)));

  const orderItemRows = payload.line_items
    .map((item, i) => ({ item, variantId: variantIds[i] }))
    .filter((row): row is { item: (typeof payload.line_items)[number]; variantId: string } => row.variantId !== null)
    .map(({ item, variantId }) => ({
      order_id: order.id,
      variant_id: variantId,
      quantity: item.quantity,
      unit_price: Number(item.price),
    }));

  if (orderItemRows.length > 0) {
    // One batch insert for every line item instead of one request per item
    // — cuts what used to be N sequential round-trips down to 1.
    const { error: itemsError } = await supabase.from("order_items").insert(orderItemRows);
    if (itemsError) {
      throw new Error(`upsertShopifyOrder (order_items) failed: ${itemsError.message}`);
    }
  }
}
