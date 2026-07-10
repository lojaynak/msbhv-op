import { createAdminClient } from "@/lib/supabase/admin";
import type { ShopifyFulfillmentPayload } from "@/lib/shopify/types";
import { mapShopifyFulfillmentStatus } from "@/lib/shopify/status-map";

/**
 * Handles fulfillments/create and fulfillments/update. Looks up the parent
 * order by shopify_order_id — if that order hasn't synced yet (a
 * fulfillment webhook arriving before its order webhook, which Shopify
 * doesn't strictly guarantee ordering on), this silently skips rather than
 * failing; the next orders/updated webhook will catch it up.
 */
export async function upsertShopifyFulfillment(payload: ShopifyFulfillmentPayload): Promise<void> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("shopify_order_id", String(payload.order_id))
    .maybeSingle();

  if (!order) return;

  const { error } = await supabase.from("shipments").upsert(
    {
      shopify_fulfillment_id: String(payload.id),
      order_id: order.id,
      carrier: payload.tracking_company,
      tracking_number: payload.tracking_number,
      status: mapShopifyFulfillmentStatus(payload.status),
      shipped_at: payload.created_at,
    },
    { onConflict: "shopify_fulfillment_id" },
  );

  if (error) {
    throw new Error(`upsertShopifyFulfillment failed: ${error.message}`);
  }
}
