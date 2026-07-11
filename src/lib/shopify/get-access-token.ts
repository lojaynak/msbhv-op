import { getShopifyEnv } from "./env";

/**
 * Client Credentials Grant — the auth model for Dev Dashboard apps built
 * for your own store (Shopify retired the old "custom app with a static
 * token" flow on Jan 1, 2026). No redirect, no consent screen: we exchange
 * the app's Client ID + Secret directly for a token.
 *
 * Tokens expire after exactly 24 hours (86399s) with no separate refresh
 * token — you just repeat this same request. Given this app's request
 * volume (webhook-driven + occasional scheduled syncs, not high QPS), we
 * fetch a fresh token per operation rather than caching one — simpler and
 * fully correct, at the cost of one extra HTTP round-trip per sync run.
 *
 * Docs: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant
 */
export async function getShopifyAccessToken(): Promise<string> {
  const { shopDomain, clientId, clientSecret } = getShopifyEnv();

  if (!shopDomain || !clientId || !clientSecret) {
    throw new Error(
      "Shopify isn't configured — SHOPIFY_SHOP_DOMAIN, SHOPIFY_CLIENT_ID, and " +
        "SHOPIFY_CLIENT_SECRET must all be set.",
    );
  }

  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify token request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}
