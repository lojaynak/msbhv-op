import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type CurrentUser = Tables<"users"> & {
  role: Tables<"roles"> | null;
};

/**
 * Re-validates the session server-side and loads the app-facing user profile
 * (role, name, avatar) in one call. Used at the top of the (dashboard)
 * layout and any Server Component/Action that needs to know who's signed in
 * or what they're allowed to do — never trust middleware alone (§2).
 *
 * Redirects to /login if there is no valid session.
 */
export async function requireUser(): Promise<CurrentUser> {
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
 * Same as requireUser(), but returns null instead of redirecting. Useful for
 * pages that render differently for signed-in vs. signed-out users (none in
 * Phase 1, since there's no public sign-up, but kept here as the one place
 * this logic lives).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
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
