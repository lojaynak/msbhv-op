import { NextResponse, type NextRequest } from "next/server";

// NOTE — Phase 1, app-shell step: Supabase isn't connected yet, so the
// session-refresh + redirect-to-login logic (lib/supabase/middleware.ts)
// is intentionally not called here — calling supabase.auth.getUser()
// against placeholder env vars would just fail on every request. This
// re-enables `updateSession(request)` in the auth-connection step; the
// helper is already written and unit-testable in isolation.
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - image/font file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
