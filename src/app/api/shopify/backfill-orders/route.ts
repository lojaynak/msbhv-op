import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/get-session";
import { backfillShopifyOrders } from "@/features/shopify/sync/backfill-orders";

export const dynamic = "force-dynamic";
// Give this more headroom than the default — pulling and upserting up to
// ~1000 orders across multiple GraphQL pages can take a while. Vercel caps
// this per plan (Hobby allows up to 60s); if your plan allows less, lower
// pages will still complete and the button can simply be clicked again.
export const maxDuration = 60;

export async function POST() {
  const user = await requireUser();
  if (user.role?.name !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const result = await backfillShopifyOrders();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
