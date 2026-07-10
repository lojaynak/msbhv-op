import { NextResponse, type NextRequest } from "next/server";
import { verifyShopifyWebhook } from "@/lib/shopify/verify-webhook";
import { recordIntegrationError, recordIntegrationSuccess } from "@/lib/integrations/health";
import { upsertShopifyOrder } from "@/features/shopify/sync/upsert-order";
import { upsertShopifyFulfillment } from "@/features/shopify/sync/upsert-fulfillment";
import { upsertShopifyRefund } from "@/features/shopify/sync/upsert-refund";
import type {
  ShopifyFulfillmentPayload,
  ShopifyOrderPayload,
  ShopifyRefundPayload,
} from "@/lib/shopify/types";

// Webhook endpoints must never be statically cached or optimized away.
export const dynamic = "force-dynamic";

/**
 * Single endpoint for all six Stage 1 webhook topics — Shopify sends the
 * topic in the `X-Shopify-Topic` header, so one route can dispatch to the
 * right handler rather than needing six separate URLs.
 *
 * Order of operations matters here: we read the RAW body text first (for
 * signature verification) and only JSON.parse it after the signature
 * checks out — parsing first and re-serializing would change the bytes
 * and break verification. See verify-webhook.ts.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");

  if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
    // Deliberately vague response — don't tell a forged request what
    // specifically was wrong with it.
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!topic) {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);

  try {
    switch (topic) {
      case "orders/create":
      case "orders/updated":
      case "orders/cancelled":
        await upsertShopifyOrder(payload as ShopifyOrderPayload);
        break;
      case "fulfillments/create":
      case "fulfillments/update":
        await upsertShopifyFulfillment(payload as ShopifyFulfillmentPayload);
        break;
      case "refunds/create":
        await upsertShopifyRefund(payload as ShopifyRefundPayload);
        break;
      default:
        // Unrecognized topic — acknowledge so Shopify doesn't retry, but
        // don't process it.
        return NextResponse.json({ ok: true, ignored: topic });
    }

    await recordIntegrationSuccess("shopify");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await recordIntegrationError("shopify", error);
    // 500 tells Shopify to retry with backoff — appropriate for a
    // transient failure (e.g. Supabase hiccup), which is the common case.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
