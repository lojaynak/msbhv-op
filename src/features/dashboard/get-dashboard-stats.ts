import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type DashboardStats = {
  connected: boolean;
  todaysOrders: number;
  pendingConfirmation: number;
  confirmed: number;
  readyToShip: number;
  inTransit: number;
  delivered: number;
  returned: number;
  revenue: number;
  cashWaiting: number;
  inventoryAlerts: number;
};

const EMPTY_STATS: DashboardStats = {
  connected: false,
  todaysOrders: 0,
  pendingConfirmation: 0,
  confirmed: 0,
  readyToShip: 0,
  inTransit: 0,
  delivered: 0,
  returned: 0,
  revenue: 0,
  cashWaiting: 0,
  inventoryAlerts: 0,
};

/**
 * Returns midnight *in Cairo*, as a UTC ISO string — not the server's own
 * local time. Vercel's serverless functions run in UTC, so a naive
 * `new Date().setHours(0,0,0,0)` computes UTC midnight, not Cairo midnight
 * (UTC+2 in winter, UTC+3 during Egypt's DST window) — meaning orders
 * placed late evening or early morning Cairo time could be miscounted as
 * "yesterday" or "today" incorrectly. Uses Intl's timezone data rather
 * than a hardcoded offset, so it stays correct across DST changes.
 */
function getStartOfTodayInCairo(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  // Find the UTC offset actually in effect for Cairo today (handles DST).
  const cairoNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
  const utcNow = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = cairoNow.getTime() - utcNow.getTime();

  const midnightCairoAsUtc = new Date(`${year}-${month}-${day}T00:00:00.000Z`).getTime() - offsetMs;
  return new Date(midnightCairoAsUtc).toISOString();
}

/**
 * Replaces every mock dashboard number with a real Supabase query. Every
 * count uses PostgREST's `count: "exact", head: true` so only a row count
 * is returned, not the actual rows — cheap even as tables grow.
 *
 * Deliberately defensive: if Supabase isn't configured yet (placeholder env
 * vars) or a query fails for any reason, this returns zeroed stats with
 * `connected: false` instead of throwing and crashing the dashboard page.
 * The page shows a small notice in that case rather than a hard error.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured()) {
    return EMPTY_STATS;
  }

  try {
    const supabase = await createClient();
    const startOfToday = getStartOfTodayInCairo();

    const countByStatus = (status: string) =>
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", status);

    const [
      todaysOrders,
      pendingConfirmation,
      confirmed,
      readyToShip,
      inTransit,
      delivered,
      returned,
      revenueRows,
      cashWaitingRows,
      inventoryAlerts,
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfToday),
      countByStatus("pending_confirmation"),
      countByStatus("confirmed"),
      countByStatus("ready_to_ship"),
      countByStatus("in_transit"),
      countByStatus("delivered"),
      countByStatus("returned"),
      supabase
        .from("orders")
        .select("total")
        .neq("status", "cancelled")
        .returns<{ total: number }[]>(),
      supabase
        .from("payments")
        .select("amount")
        .eq("status", "pending")
        .eq("method", "cod")
        .returns<{ amount: number }[]>(),
      supabase.from("v_low_stock_inventory").select("*", { count: "exact", head: true }),
    ]);

    const revenue = (revenueRows.data ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);
    const cashWaiting = (cashWaitingRows.data ?? []).reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0,
    );

    return {
      connected: true,
      todaysOrders: todaysOrders.count ?? 0,
      pendingConfirmation: pendingConfirmation.count ?? 0,
      confirmed: confirmed.count ?? 0,
      readyToShip: readyToShip.count ?? 0,
      inTransit: inTransit.count ?? 0,
      delivered: delivered.count ?? 0,
      returned: returned.count ?? 0,
      revenue,
      cashWaiting,
      inventoryAlerts: inventoryAlerts.count ?? 0,
    };
  } catch {
    return EMPTY_STATS;
  }
}
