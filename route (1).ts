import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Phase 2: Supabase is connected — session refresh + redirect-to-login is
// live again. (It was a no-op during the mock-data app-shell phase because
// calling supabase.auth.getUser() against placeholder env vars would fail
// on every request.)
export async function middleware(request: NextRequest) {
  return updateSession(request);
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
