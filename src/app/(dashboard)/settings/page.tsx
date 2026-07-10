import { requireUser } from "@/lib/auth/get-session";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsView user={user} />;
}
