import { getRecentOrders } from "@/features/orders/get-orders";
import { OrdersView } from "@/features/orders/components/orders-view";

// Server Component — fetches real orders (joined with customer name)
// server-side, then hands them to the client view for translated chrome
// and rendering. Same pattern as the Dashboard page.
export default async function OrdersPage() {
  const { orders, connected } = await getRecentOrders();
  return <OrdersView orders={orders} connected={connected} />;
}
