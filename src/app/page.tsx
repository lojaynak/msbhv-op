import { redirect } from "next/navigation";

// No auth gate in this phase (Supabase isn't connected yet) — root just
// forwards straight into the dashboard shell for preview purposes.
export default function RootPage() {
  redirect("/dashboard");
}
