import { getRecentShipments } from "@/features/shipments/get-shipments";
import { ShipmentsView } from "@/features/shipments/components/shipments-view";

export default async function ShipmentsPage() {
  const { shipments, connected } = await getRecentShipments();
  return <ShipmentsView shipments={shipments} connected={connected} />;
}
