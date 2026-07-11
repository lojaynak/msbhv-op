import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./is-configured";

/**
 * Supabase client for use in Client Components. Reads the public env vars
 * (safe to expose — see architecture doc §6.2). Works identically on
 * localhost and on Vercel; nothing here is environment-specific. Accepts
 * either the new publishable key or the legacy anon key — see is-configured.ts.
 */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient<Database>(url!, key!);
}
