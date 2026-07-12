import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string;
};

const PAGE_SIZE = 50;

/**
 * Most recent orders first, joined with the customer's name. Capped at 50
 * for now — real pagination/filtering is a natural next step once this is
 * the primary way staff work with orders, not a blocker for seeing real
 * data today.
 */
export async function getRecentOrders(): Promise<{ orders: OrderRow[]; connected: boolean }> {
  if (!isSupabaseConfigured()) {
    return { orders: [], connected: false };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, total, created_at, customer:customers(full_name)")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error || !data) {
      return { orders: [], connected: true };
    }

    return {
      connected: true,
      orders: data.map((row) => ({
        id: row.id,
        order_number: row.order_number,
        status: row.status,
        total: Number(row.total),
        created_at: row.created_at,
        customer_name: (row.customer as unknown as { full_name: string } | null)?.full_name ?? "—",
      })),
    };
  } catch {
    return { orders: [], connected: false };
  }
}
