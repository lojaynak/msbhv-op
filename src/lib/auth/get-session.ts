import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type CurrentUser = Tables<"users"> & {
  role: Tables<"roles"> | null;
};

/** Shown in the shell while Supabase isn't connected yet — never a real signed-in user. */
const PLACEHOLDER_USER: CurrentUser = {
  id: "00000000-0000-0000-0000-000000000000",
  full_name: "Not connected",
  email: "—",
  avatar_url: null,
  role_id: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  role: null,
};

/**
 * Re-validates the session server-side and loads the app-facing user profile
 * (role, name, avatar) in one call. Used at the top of the (dashboard)
 * layout and any Server Component/Action that needs to know who's signed in
 * or what they're allowed to do — never trust middleware alone.
 *
 * Redirects to /login if there is no valid session — UNLESS Supabase isn't
 * configured yet, in which case it returns a clearly-labeled placeholder
 * user so the shell still renders (with a "not connected" notice elsewhere)
 * instead of redirect-looping to a login page that can't authenticate
 * anyone yet.
 */
export async function requireUser(): Promise<CurrentUser> {
  if (!isSupabaseConfigured()) {
    return PLACEHOLDER_USER;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  return profile as CurrentUser;
}

/**
 * Same as requireUser(), but returns null instead of redirecting or
 * returning a placeholder. Useful for pages that render differently for
 * signed-in vs. signed-out users.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single();

  return (profile as CurrentUser | null) ?? null;
}
