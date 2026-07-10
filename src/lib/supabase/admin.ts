import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Privileged Supabase client using the secret key (bypasses RLS entirely).
 *
 * ONLY use this for genuinely system-level writes with no signed-in user to
 * attribute the action to — currently: Shopify/ShipBlu webhook processing
 * and scheduled sync jobs. Every other server-side query in this app uses
 * lib/supabase/server.ts, which runs as the signed-in user and is bound by
 * RLS like everyone else. Never import this into a page, a normal Server
 * Action, or anything reachable from a user-facing request.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "createAdminClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or the legacy " +
        "SUPABASE_SERVICE_ROLE_KEY) must both be set. This client is only used by webhook " +
        "and sync code, which should never run before Supabase is fully configured.",
    );
  }

  return createSupabaseClient<Database, "public">(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
