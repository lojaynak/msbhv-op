/**
 * Pulls orders directly via the Admin API — covers whatever window Shopify
 * allows without the `read_all_orders` scope, which is the last 60 days for
 * an app that hasn't gone through Shopify's protected-data approval for
 * older history. That's a hard platform limit, not something this query
 * can work around; anything older needs the CSV import path instead.
 *
 * Uses `legacyResourceId` wherever available — that's Shopify's own plain
 * numeric ID, so no manual GID-string parsing is needed to stay consistent
 * with the numeric IDs webhook payloads already use (see types.ts).
 */
export const BACKFILL_ORDERS_QUERY = `
  query BackfillOrders($cursor: String) {
    orders(first: 3, after: $cursor, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        legacyResourceId
        name
        email
        phone
        displayFulfillmentStatus
        cancelledAt
        createdAt
        subtotalPriceSet { shopMoney { amount } }
        totalDiscountsSet { shopMoney { amount } }
        totalShippingPriceSet { shopMoney { amount } }
        totalPriceSet { shopMoney { amount } }
        customer {
          legacyResourceId
          firstName
          lastName
          email
          phone
          defaultAddress { address1 city province country phone }
        }
        shippingAddress { address1 city province country phone }
        lineItems(first: 50) {
          nodes {
            title
            variantTitle
            quantity
            sku
            originalUnitPriceSet { shopMoney { amount } }
            product { legacyResourceId }
            variant { legacyResourceId }
          }
        }
      }
    }
  }
`;

export type BackfillOrderNode = {
  legacyResourceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  displayFulfillmentStatus: string;
  cancelledAt: string | null;
  createdAt: string;
  subtotalPriceSet: { shopMoney: { amount: string } };
  totalDiscountsSet: { shopMoney: { amount: string } };
  totalShippingPriceSet: { shopMoney: { amount: string } };
  totalPriceSet: { shopMoney: { amount: string } };
  customer: {
    legacyResourceId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    defaultAddress: {
      address1: string | null;
      city: string | null;
      province: string | null;
      country: string | null;
      phone: string | null;
    } | null;
  } | null;
  shippingAddress: {
    address1: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    phone: string | null;
  } | null;
  lineItems: {
    nodes: {
      title: string;
      variantTitle: string | null;
      quantity: number;
      sku: string | null;
      originalUnitPriceSet: { shopMoney: { amount: string } };
      product: { legacyResourceId: string } | null;
      variant: { legacyResourceId: string } | null;
    }[];
  };
};

export type BackfillOrdersResponse = {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: BackfillOrderNode[];
  };
};
