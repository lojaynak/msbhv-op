import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/get-session";
import { backfillShopifyOrdersPage } from "@/features/shopify/sync/backfill-orders";

export const dynamic = "force-dynamic";
// 60s is the max Vercel's Hobby plan allows. Each page is now just 3
// orders (down from 25), so this is generous headroom, not a requirement.
export const maxDuration = 60;

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
