import { createAdminClient } from "@/lib/supabase/admin";
import type { ShopifyAddress, ShopifyCustomer } from "@/lib/shopify/types";

/**
 * Upserts by `shopify_customer_id` — the whole point of storing that column
 * is so re-processing the same customer (e.g. from a second order, or a
 * retried webhook) never creates a duplicate row.
 *
 * Address is taken from the order's shipping_address, not the customer's
 * Shopify default_address — that's the address actually used for this
 * delivery, and it keeps the customer record's address reasonably current
 * as new orders come in.
 */
export async function upsertCustomerFromOrder(
  customer: ShopifyCustomer,
  shippingAddress: ShopifyAddress | null,
): Promise<string> {
  const supabase = createAdminClient();

  const fullName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Unknown Customer";

  const { data, error } = await supabase
    .from("customers")
    .upsert(
      {
        shopify_customer_id: String(customer.id),
        full_name: fullName,
        phone: customer.phone ?? shippingAddress?.phone ?? "",
        email: customer.email,
        address_line: shippingAddress?.address1 ?? null,
        city: shippingAddress?.city ?? null,
        governorate: shippingAddress?.province ?? null,
        source: "shopify",
      },
      { onConflict: "shopify_customer_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`upsertCustomerFromOrder failed: ${error?.message}`);
  }

  return data.id;
}
