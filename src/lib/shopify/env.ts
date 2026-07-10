/**
 * All server-only. None of these are ever sent to the browser — the
 * Shopify client/token/webhook code only runs in Route Handlers and
 * scheduled jobs, never in Client Components.
 */
export function getShopifyEnv() {
  return {
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN, // e.g. "your-store.myshopify.com"
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
    apiVersion: process.env.SHOPIFY_API_VERSION || "2026-04",
  };
}

export function isShopifyConfigured(): boolean {
  const { shopDomain, clientId, clientSecret } = getShopifyEnv();
  return Boolean(shopDomain && clientId && clientSecret);
}
