import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/get-session";
import { backfillShopifyOrdersPage } from "@/features/shopify/sync/backfill-orders";

export const dynamic = "force-dynamic";
// One page (25 orders) per call is fast — this is headroom, not a
// requirement. See backfill-orders.ts for why pagination exists at all.
export const maxDuration = 30;

export async function POST(request: Request) {
  const user = await requireUser();
  if (user.role?.name !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let cursor: string | null = null;
  try {
    const body = await request.json();
    cursor = body?.cursor ?? null;
  } catch {
    // No body / not JSON — fine, means "start from the beginning".
  }

  try {
    const result = await backfillShopifyOrdersPage(cursor);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
