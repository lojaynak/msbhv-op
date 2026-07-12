import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type ShipmentRow = {
  id: string;
  order_number: string;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  updated_at: string;
};

const PAGE_SIZE = 50;

export async function getRecentShipments(): Promise<{ shipments: ShipmentRow[]; connected: boolean }> {
  if (!isSupabaseConfigured()) {
    return { shipments: [], connected: false };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("id, carrier, tracking_number, status, updated_at, order:orders(order_number)")
      .order("updated_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error || !data) {
      return { shipments: [], connected: true };
    }

    return {
      connected: true,
      shipments: data.map((row) => ({
        id: row.id,
        order_number: (row.order as unknown as { order_number: string } | null)?.order_number ?? "—",
        carrier: row.carrier,
        tracking_number: row.tracking_number,
        status: row.status,
        updated_at: row.updated_at,
      })),
    };
  } catch {
    return { shipments: [], connected: false };
  }
}
