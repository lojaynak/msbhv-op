import { requireUser } from "@/lib/auth/get-session";
import { DashboardShell } from "@/components/layout/dashboard-shell";

// Every route under (dashboard) shows live, per-user data (auth state,
// real-time stats) — never statically cache these at build time.
export const dynamic = "force-dynamic";

// Server Component — re-validates the session server-side on every
// navigation (defense in depth, on top of middleware.ts). Returns a clearly
// labeled placeholder user instead of enforcing auth if Supabase isn't
// configured yet — see lib/auth/get-session.ts.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
