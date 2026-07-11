import { createAdminClient } from "@/lib/supabase/admin";

export type IntegrationName = "shopify" | "shipblu";

/** Call after every successful webhook process or sync run. */
export async function recordIntegrationSuccess(integration: IntegrationName) {
  const supabase = createAdminClient();
  await supabase
    .from("integration_status")
    .update({ connected: true, last_success_at: new Date().toISOString() })
    .eq("integration", integration);
}

/** Call after any failed webhook process or sync run — never throws itself. */
export async function recordIntegrationError(integration: IntegrationName, error: unknown) {
  try {
    const supabase = createAdminClient();
    const message = error instanceof Error ? error.message : String(error);
    await supabase
      .from("integration_status")
      .update({ last_error: message.slice(0, 2000), last_error_at: new Date().toISOString() })
      .eq("integration", integration);
  } catch {
    // Don't let a failure to *record* the error mask the original error.
  }
}
