/**
 * Shopify's order/fulfillment statuses describe e-commerce state (payment
 * captured, label generated); our schema's `orders.status` and
 * `shipments.status` describe MSBHV's operational workflow. These don't
 * map 1:1, so the mappings below are a deliberate, coarse starting point —
 * Stage 2's ShipBlu sync is what actually drives granular delivery status
 * (picked_up / in_transit / out_for_delivery / delivered); Shopify's own
 * fulfillment webhook mainly tells us "a shipment now exists."
 */

export function mapShopifyOrderStatus(params: {
  cancelledAt: string | null;
  fulfillmentStatus: string | null;
}): string {
  if (params.cancelledAt) return "cancelled";
  switch (params.fulfillmentStatus) {
    case "fulfilled":
      return "in_transit"; // Shopify "fulfilled" = label/shipment created, not delivered
    case "partial":
      return "confirmed";
    default:
      return "pending_confirmation"; // null fulfillment_status = brand new, unfulfilled order
  }
}

export function mapShopifyFulfillmentStatus(shopifyStatus: string): string {
  switch (shopifyStatus) {
    case "success":
      return "in_transit";
    case "cancelled":
    case "error":
    case "failure":
      return "failed";
    case "pending":
    case "open":
    default:
      return "pending";
  }
}
