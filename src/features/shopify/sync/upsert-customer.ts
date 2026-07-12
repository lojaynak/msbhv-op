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

/**
 * Fallback for orders with no linked Shopify customer profile — guest
 * checkouts, or draft/manual orders created without picking a customer
 * (very common when testing by marking a draft order as paid, which is
 * exactly how this was being tested). These orders still carry contact
 * info (email/phone) at the order level even with no `customer` object.
 *
 * There's no shopify_customer_id to upsert against here, so — matching the
 * same principle used for CSV imports — this matches an existing customer
 * by **phone number** first (if one was provided) before falling back to
 * inserting a new row. Not a perfect merge (a guest who never gives a
 * phone number gets a new row per order), but it's the difference between
 * an order silently never appearing and an order that's tracked with a
 * best-effort customer match.
 */
export async function upsertGuestCustomerFromOrder(params: {
  email: string | null;
  phone: string | null;
  shippingAddress: ShopifyAddress | null;
}): Promise<string | null> {
  const phone = params.phone ?? params.shippingAddress?.phone ?? null;
  const supabase = createAdminClient();

  if (phone) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();

    if (existing) return existing.id;
  }

  if (!phone && !params.email) {
    // No identifying information at all — genuinely nothing to attach a
    // customer record to.
    return null;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      full_name: "Guest Checkout",
      phone: phone ?? "",
      email: params.email,
      address_line: params.shippingAddress?.address1 ?? null,
      city: params.shippingAddress?.city ?? null,
      governorate: params.shippingAddress?.province ?? null,
      source: "shopify",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`upsertGuestCustomerFromOrder failed: ${error?.message}`);
  }

  return data.id;
}
