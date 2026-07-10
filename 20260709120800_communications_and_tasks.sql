import { createAdminClient } from "@/lib/supabase/admin";
import type { ShopifyOrderPayload } from "@/lib/shopify/types";
import { mapShopifyOrderStatus } from "@/lib/shopify/status-map";
import { upsertCustomerFromOrder } from "./upsert-customer";
import { upsertProductVariantStub } from "./upsert-product-stub";

/**
 * Handles orders/create, orders/updated, and orders/cancelled — all three
 * webhook topics send the same payload shape, so one function covers all
 * of them. Upserts by `shopify_order_id`, so replays/retries (Shopify
 * webhooks are "at least once", never guaranteed exactly-once) are safe.
 */
export async function upsertShopifyOrder(payload: ShopifyOrderPayload): Promise<void> {
  const supabase = createAdminClient();

  const customerId = payload.customer
    ? await upsertCustomerFromOrder(payload.customer, payload.shipping_address)
    : null;

  if (!customerId) {
    // Most likely cause: Shopify is withholding customer PII because this
    // app hasn't been approved/configured for "Protected customer data
    // access" in the Dev Dashboard (App → Configuration) — scopes alone
    // aren't enough for that. Throwing (rather than silently skipping)
    // makes this show up as a visible error in Settings → Integrations
    // instead of an order just quietly never appearing.
    throw new Error(
      `Order ${payload.name} (id ${payload.id}) has no customer data in its webhook payload — ` +
        `likely missing "Protected customer data access" approval in the Shopify Dev Dashboard.`,
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

  for (const item of payload.line_items) {
    const variantId = await upsertProductVariantStub(item);
    if (!variantId) continue;

    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: order.id,
      variant_id: variantId,
      quantity: item.quantity,
      unit_price: Number(item.price),
    });

    if (itemError) {
      throw new Error(`upsertShopifyOrder (order_items) failed: ${itemError.message}`);
    }
  }
}
