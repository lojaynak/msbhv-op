import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Not used by the password sign-in flow (login-form.tsx / actions.ts), but
// reserved for magic-link or OAuth sign-in if those are added later —
// Supabase redirects here with a `code` param to exchange for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
