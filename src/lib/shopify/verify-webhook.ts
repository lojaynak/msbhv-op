import { createHmac, timingSafeEqual } from "node:crypto";
import { getShopifyEnv } from "./env";

/**
 * Verifies the `X-Shopify-Hmac-Sha256` header against the raw request body,
 * using the app's Client Secret. This is what proves a webhook request
 * genuinely came from Shopify and wasn't forged — every webhook handler
 * must call this before trusting the payload.
 *
 * IMPORTANT: must be run against the raw, unparsed request body. Reading
 * `request.json()` first and re-serializing will change whitespace/key
 * order and break the signature check — see the route handler for how the
 * raw text is captured before any JSON parsing happens.
 */
export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;

  const { clientSecret } = getShopifyEnv();
  if (!clientSecret) return false;

  const digest = createHmac("sha256", clientSecret).update(rawBody, "utf8").digest("base64");

  const digestBuffer = Buffer.from(digest);
  const headerBuffer = Buffer.from(hmacHeader);

  // Lengths must match before timingSafeEqual — it throws on mismatched
  // buffer lengths instead of returning false.
  if (digestBuffer.length !== headerBuffer.length) return false;

  return timingSafeEqual(digestBuffer, headerBuffer);
}
