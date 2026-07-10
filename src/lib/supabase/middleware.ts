import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./is-configured";

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated users away from protected routes. Called from the root
 * `middleware.ts`. This is the first line of defense — every protected
 * route also re-validates the session server-side (see lib/auth/get-session.ts)
 * because middleware alone is not sufficient for a data-sensitive internal
 * tool. Defense in depth, not defense in one place.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { url, key } = getSupabaseEnv();

  // Not configured yet — pass through rather than enforcing auth against a
  // Supabase project that doesn't exist. Once real env vars are set (in
  // .env.local or Vercel), this block stops triggering automatically.
  if (!url || !key || url.includes("placeholder")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isPublicAsset = request.nextUrl.pathname.startsWith("/auth/callback");

  let user = null;
  try {
    // IMPORTANT: do not run other logic between createServerClient and
    // getUser(). A simple mistake here can cause a hard-to-debug session
    // desync between server and client.
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase URL configured but unreachable (typo, project paused, etc.)
    // — fail open rather than taking the whole site down.
    return supabaseResponse;
  }

  if (!user && !isAuthRoute && !isPublicAsset) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
