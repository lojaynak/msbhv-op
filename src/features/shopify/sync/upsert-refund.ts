import { createAdminClient } from "@/lib/supabase/admin";
import type { ShopifyRefundPayload } from "@/lib/shopify/types";

/**
 * Handles refunds/create. A Shopify refund can bundle multiple
 * transactions (partial refunds, multiple gateways); we record one
 * `payments` row per transaction, each upserted by shopify_transaction_id.
 */
export async function upsertShopifyRefund(payload: ShopifyRefundPayload): Promise<void> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("shopify_order_id", String(payload.order_id))
    .maybeSingle();

  if (!order) return;

  for (const txn of payload.transactions) {
    const { error } = await supabase.from("payments").upsert(
      {
        shopify_transaction_id: String(txn.id),
        order_id: order.id,
        amount: Number(txn.amount),
        method: txn.kind || "card",
        status: "refunded",
        collected_at: payload.created_at,
      },
      { onConflict: "shopify_transaction_id" },
    );

    if (error) {
      throw new Error(`upsertShopifyRefund failed: ${error.message}`);
    }
  }

  // A refund implies the order itself should read as returned.
  await supabase.from("orders").update({ status: "returned" }).eq("id", order.id);
}
