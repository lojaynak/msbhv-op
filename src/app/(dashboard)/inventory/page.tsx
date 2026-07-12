import { getInventory } from "@/features/inventory/get-inventory";
import { InventoryView } from "@/features/inventory/components/inventory-view";

export default async function InventoryPage() {
  const { items, connected } = await getInventory();
  return <InventoryView items={items} connected={connected} />;
}
