import { getShopifyEnv } from "./env";
import { getShopifyAccessToken } from "./get-access-token";

export class ShopifyGraphQLError extends Error {
  constructor(
    message: string,
    public errors: unknown,
  ) {
    super(message);
    this.name = "ShopifyGraphQLError";
  }
}

/**
 * Runs a GraphQL Admin API query/mutation against the configured store.
 * Fetches a fresh access token per call — see get-access-token.ts for why.
 */
export async function shopifyGraphQL<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { shopDomain, apiVersion } = getShopifyEnv();
  const accessToken = await getShopifyAccessToken();

  const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new ShopifyGraphQLError(
      `Shopify GraphQL request failed (${response.status})`,
      json.errors ?? json,
    );
  }

  return json.data as T;
}
