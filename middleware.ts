import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ANALYTICS_SESSION_COOKIE = "wv_sid";
const ANALYTICS_SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const IMPERSONATION_COOKIE = "impersonation_session";

/**
 * Middleware: refresh Supabase session; inject impersonation headers when impersonation_session cookie is set.
 */
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Fail-soft: all /api/admin/* (except sandbox-v2, impersonate) return 200 empty in sandbox — no 500s, no blocking
  if (
    path.startsWith("/api/admin") &&
    process.env.ENV === "SANDBOX" &&
    !path.startsWith("/api/admin/sandbox-v2") &&
    !path.startsWith("/api/admin/impersonate")
  ) {
    return NextResponse.json(
      { data: [], notice: "Not available in sandbox" },
      { status: 200 }
    );
  }

  const requestHeaders = new Headers(req.headers);

  const impersonation = req.cookies.get(IMPERSONATION_COOKIE)?.value;
  if (impersonation) {
    try {
      const session = JSON.parse(impersonation) as { impersonatedUserId?: string };
      if (session.impersonatedUserId) {
        requestHeaders.set("x-impersonated-user-id", session.impersonatedUserId);
        requestHeaders.set("x-is-impersonating", "true");
      }
    } catch {
      // invalid cookie — ignore
    }
  }

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    try {
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      });
      await supabase.auth.getSession();
    } catch {
      // Supabase session refresh must not block impersonation
    }
  }

  // Internal analytics: set anonymous session ID for page-view capture (GDPR: no PII in cookie).
  // Skip when impersonating so analytics session logic cannot block impersonation.
  const isImpersonating = !!req.cookies.get(IMPERSONATION_COOKIE)?.value;
  if (!isImpersonating) {
    try {
      if (!req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value) {
        res.cookies.set(ANALYTICS_SESSION_COOKIE, crypto.randomUUID(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: ANALYTICS_SESSION_MAX_AGE,
          path: "/",
        });
      }
    } catch {
      // Analytics session set must not block response
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next|favicon.ico|api).*)"],
};
