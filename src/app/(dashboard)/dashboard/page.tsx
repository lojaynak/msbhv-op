import { getDashboardStats } from "@/features/dashboard/get-dashboard-stats";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

// Server Component — fetches real Supabase data server-side, then hands it
// to the client view for rendering + translation. See get-dashboard-stats.ts
// for the query logic and its "not connected yet" fallback behavior.
export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return <DashboardView stats={stats} />;
}
