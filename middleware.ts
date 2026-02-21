import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ANALYTICS_SESSION_COOKIE = "wv_sid";
const ANALYTICS_SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Middleware: refresh Supabase session (so Server Components can read it).
 * No auth redirects or role checks here.
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

  const res = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
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
  }

  // Internal analytics: set anonymous session ID for page-view capture (GDPR: no PII in cookie)
  if (!req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value) {
    res.cookies.set(ANALYTICS_SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ANALYTICS_SESSION_MAX_AGE,
      path: "/",
    });
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next|favicon.ico|api).*)"],
};
