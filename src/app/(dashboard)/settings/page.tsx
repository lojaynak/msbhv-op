import { requireUser } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SettingsView } from "./settings-view";
import type { Tables } from "@/lib/supabase/database.types";

export default async function SettingsPage() {
  const user = await requireUser();

  let integrations: Tables<"integration_status">[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("integration_status").select("*");
    integrations = data ?? [];
  }

  return <SettingsView user={user} integrations={integrations} />;
}
