import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./is-configured";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads/writes the session via Next.js cookies, so auth state is
 * consistent across the server and client. This is what actually enforces
 * RLS server-side — every query made with this client runs as the signed-in
 * user, never as an elevated role.
 *
 * Must be created fresh per request (cookies() is request-scoped) — do not
 * cache or reuse a single instance across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient<Database>(url!, key!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component during a render pass that can't
          // set cookies (e.g. a page, not an action). Safe to ignore here
          // because `middleware.ts` refreshes the session on every request.
        }
      },
    },
  });
}
