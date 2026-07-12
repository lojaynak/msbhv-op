import { getRecentCustomers } from "@/features/customers/get-customers";
import { CustomersView } from "@/features/customers/components/customers-view";

export default async function CustomersPage() {
  const { customers, connected } = await getRecentCustomers();
  return <CustomersView customers={customers} connected={connected} />;
}
