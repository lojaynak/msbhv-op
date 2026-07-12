import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type InventoryRow = {
  id: string;
  product_name: string;
  sku: string;
  size: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  low_stock_threshold: number;
};

const PAGE_SIZE = 100;

export async function getInventory(): Promise<{ items: InventoryRow[]; connected: boolean }> {
  if (!isSupabaseConfigured()) {
    return { items: [], connected: false };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inventory")
      .select(
        "id, quantity_on_hand, quantity_reserved, low_stock_threshold, variant:product_variants(sku, size, product:products(name))",
      )
      .order("quantity_on_hand", { ascending: true })
      .limit(PAGE_SIZE);

    if (error || !data) {
      return { items: [], connected: true };
    }

    return {
      connected: true,
      items: data.map((row) => {
        const variant = row.variant as unknown as {
          sku: string;
          size: string | null;
          product: { name: string } | null;
        } | null;

        return {
          id: row.id,
          product_name: variant?.product?.name ?? "—",
          sku: variant?.sku ?? "—",
          size: variant?.size ?? null,
          quantity_on_hand: row.quantity_on_hand,
          quantity_reserved: row.quantity_reserved,
          low_stock_threshold: row.low_stock_threshold,
        };
      }),
    };
  } catch {
    return { items: [], connected: false };
  }
}
