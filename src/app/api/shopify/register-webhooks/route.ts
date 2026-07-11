import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/get-session";
import { shopifyGraphQL } from "@/lib/shopify/graphql-client";
import { recordIntegrationError, recordIntegrationSuccess } from "@/lib/integrations/health";

export const dynamic = "force-dynamic";

const TOPICS = [
  "ORDERS_CREATE",
  "ORDERS_UPDATED",
  "ORDERS_CANCELLED",
  "FULFILLMENTS_CREATE",
  "FULFILLMENTS_UPDATE",
  "REFUNDS_CREATE",
] as const;

const MUTATION = `
  mutation RegisterWebhook($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
    webhookSubscriptionCreate(
      topic: $topic
      webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }
    ) {
      webhookSubscription { id topic }
      userErrors { field message }
    }
  }
`;

/**
 * One-time setup action (triggered from Settings → Integrations, not run
 * automatically) — registers all six Stage 1 webhook subscriptions
 * pointing at this app's own webhook endpoint. Safe to run more than
 * once: Shopify returns a userError ("already exists") for a topic that's
 * already registered rather than creating a duplicate, which this surfaces
 * per-topic rather than failing the whole batch.
 */
export async function POST() {
  const user = await requireUser();
  if (user.role?.name !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    return NextResponse.json(
      { error: "SITE_URL environment variable is not set." },
      { status: 500 },
    );
  }

  const callbackUrl = `${siteUrl}/api/webhooks/shopify`;
  const results: { topic: string; ok: boolean; message?: string }[] = [];

  try {
    for (const topic of TOPICS) {
      const data = await shopifyGraphQL<{
        webhookSubscriptionCreate: {
          webhookSubscription: { id: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>(MUTATION, { topic, callbackUrl });

      const { webhookSubscription, userErrors } = data.webhookSubscriptionCreate;
      if (webhookSubscription) {
        results.push({ topic, ok: true });
      } else {
        results.push({
          topic,
          ok: false,
          message: userErrors.map((e) => e.message).join("; "),
        });
      }
    }

    const anySucceeded = results.some((r) => r.ok);
    if (anySucceeded) {
      await recordIntegrationSuccess("shopify");
    }

    return NextResponse.json({ callbackUrl, results });
  } catch (error) {
    await recordIntegrationError("shopify", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message, results }, { status: 500 });
  }
}
