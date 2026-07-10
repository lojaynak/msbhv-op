import { createAdminClient } from "@/lib/supabase/admin";
import type { ShopifyLineItem } from "@/lib/shopify/types";

/**
 * Order webhooks only include line-item-level product data (title, sku,
 * price) — not the full catalog record (description, images, category).
 * This creates/updates just enough of a product + variant row to attach
 * order_items to something real, keyed by shopify_product_id /
 * shopify_variant_id so a later full catalog sync (reading richer product
 * data) fills in the rest without creating duplicates.
 */
export async function upsertProductVariantStub(item: ShopifyLineItem): Promise<string | null> {
  if (!item.variant_id) return null; // custom/non-catalog line items have no variant

  const supabase = createAdminClient();

  let productId: string | null = null;

  if (item.product_id) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .upsert(
        {
          shopify_product_id: String(item.product_id),
          name: item.title,
          status: "active",
        },
        { onConflict: "shopify_product_id", ignoreDuplicates: false },
      )
      .select("id")
      .single();

    if (productError || !product) {
      throw new Error(`upsertProductVariantStub (product) failed: ${productError?.message}`);
    }
    productId = product.id;
  }

  if (!productId) return null;

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .upsert(
      {
        shopify_variant_id: String(item.variant_id),
        product_id: productId,
        sku: item.sku || `shopify-${item.variant_id}`,
        size: item.variant_title,
        price: Number(item.price),
      },
      { onConflict: "shopify_variant_id" },
    )
    .select("id")
    .single();

  if (variantError || !variant) {
    throw new Error(`upsertProductVariantStub (variant) failed: ${variantError?.message}`);
  }

  // Ensure an inventory row exists (doesn't overwrite real stock counts if
  // one already exists — this only guards against a missing row).
  await supabase
    .from("inventory")
    .upsert(
      { variant_id: variant.id, quantity_on_hand: 0, quantity_reserved: 0 },
      { onConflict: "variant_id", ignoreDuplicates: true },
    );

  return variant.id;
}
