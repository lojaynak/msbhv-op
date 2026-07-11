/**
 * Shopify webhook payloads follow the classic REST Admin API resource
 * shape (numeric IDs, snake_case) regardless of whether your app queries
 * via GraphQL — this is true for every Dev Dashboard app in 2026, not just
 * legacy REST apps. These types cover only the fields this app actually
 * persists; Shopify sends more than this on every payload.
 */

export type ShopifyAddress = {
  address1: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
};

export type ShopifyCustomer = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  default_address?: ShopifyAddress | null;
};

export type ShopifyLineItem = {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  sku: string | null;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: string; // Shopify sends money as decimal strings
};

export type ShopifyOrderPayload = {
  id: number;
  name: string; // e.g. "#1042" — human-readable order number
  order_number: number;
  email: string | null;
  phone: string | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  cancelled_at: string | null;
  subtotal_price: string;
  total_discounts: string;
  total_shipping_price_set?: { shop_money: { amount: string } };
  total_price: string;
  customer: ShopifyCustomer | null;
  shipping_address: ShopifyAddress | null;
  line_items: ShopifyLineItem[];
  created_at: string;
};

export type ShopifyFulfillmentPayload = {
  id: number;
  order_id: number;
  status: string; // 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure'
  tracking_company: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
};

export type ShopifyRefundTransaction = {
  id: number;
  amount: string;
  kind: string;
  status: string;
};

export type ShopifyRefundPayload = {
  id: number;
  order_id: number;
  created_at: string;
  transactions: ShopifyRefundTransaction[];
};
