/**
 * Supabase changed its client-side key naming in 2025: projects created (or
 * migrated) after that point expose a "publishable key"
 * (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, format `sb_publishable_...`)
 * instead of the legacy "anon key" (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, a JWT).
 * They're interchangeable everywhere supabase-js/ssr expects a client-side
 * key — same permissions, same RLS behavior — so this resolves either name,
 * preferring the new one, with zero other code changes required.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

/** True once real Supabase env vars are present (as opposed to unset/placeholder). */
export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnv();
  return Boolean(url && key && !url.includes("placeholder"));
}
