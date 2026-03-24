import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { NextResponse, type NextRequest } from "next/server";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { getHomePathForResolvedRole } from "@/lib/auth/roleRouting";
import {
  IMPERSONATION_SIMULATION_COOKIE,
  IMPERSONATION_HEADERS,
  parseSimulationContextFromCookie,
} from "@/lib/impersonation-simulation/context";

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const c of from.cookies.getAll()) {
    to.cookies.set(c.name, c.value, c);
  }
}

const ANALYTICS_SESSION_COOKIE = "wv_sid";
const ANALYTICS_SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const IMPERSONATION_COOKIE = "impersonation_session";

/**
 * Proxy: refresh Supabase auth session on every request (dashboard, profile, api) so cookies stay valid
 * and users are not logged out when navigating or calling API routes. Also inject impersonation headers
 * when impersonation_session cookie is set. Simulation headers only when session user is admin/superadmin.
 */
export async function proxy(req: NextRequest) {
  const impersonation = req.cookies.get(IMPERSONATION_COOKIE)?.value;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-workvouch-pathname", req.nextUrl.pathname);
  const simulationRaw = req.cookies.get(IMPERSONATION_SIMULATION_COOKIE)?.value;
  const simulationContext = parseSimulationContextFromCookie(simulationRaw);
  let allowSimulationHeaders = false;
  if (simulationContext) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anonKey) {
      try {
        const supabase = createServerClient(url, anonKey, {
          cookies: {
            getAll() {
              return req.cookies.getAll();
            },
            setAll() {
              // Read-only use: only need session for admin check
            },
          },
        });
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          const role = (profile as { role?: string } | null)?.role;
          allowSimulationHeaders = role === "admin" || role === "superadmin";
        }
      } catch {
        allowSimulationHeaders = false;
      }
    }
    if (allowSimulationHeaders) {
      requestHeaders.set(IMPERSONATION_HEADERS.ACTOR_TYPE, simulationContext.actorType);
      requestHeaders.set(IMPERSONATION_HEADERS.SCENARIO, simulationContext.scenario);
      requestHeaders.set(IMPERSONATION_HEADERS.IMPERSONATING, String(simulationContext.impersonating));
      if (simulationContext.effectiveUserId) {
        requestHeaders.set(IMPERSONATION_HEADERS.EFFECTIVE_USER_ID, simulationContext.effectiveUserId);
      }
    }
  }

  if (impersonation) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

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

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Supabase auth refresh: validate/refresh token and write updated cookies to response
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    try {
      const supabase = createServerClient<Database>(url, anonKey, {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let profileRole: string | null | undefined;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        profileRole = (profile as { role?: string | null } | null)?.role ?? undefined;
      }
      const resolved = resolveUserRole({ role: profileRole });

      const isApi = path.startsWith("/api/");
      if (!isApi) {
        console.log("PATH:", path);
        console.log("USER ROLE:", profileRole ?? resolved);
      }

      // Route protection: redirect unauthenticated users from protected routes
      const protectedRoutes = [
        "/choose-role",
        "/dashboard",
        "/my-jobs",
        "/verifications",
        "/profile",
        "/settings",
      ];
      const isProtected = protectedRoutes.some((route) =>
        path.startsWith(route)
      );
      if (isProtected && !user) {
        const out = NextResponse.redirect(new URL("/login", req.url));
        copyCookies(res, out);
        return out;
      }

      if (!isApi && user) {
        if (path === "/login" || path === "/signup") {
          const dest = getHomePathForResolvedRole(resolved);
          const out = NextResponse.redirect(new URL(dest, req.url));
          copyCookies(res, out);
          return out;
        }

        const skipPendingEnforce =
          path.startsWith("/auth/") ||
          path.startsWith("/_next/") ||
          path === "/favicon.ico" ||
          path === "/robots.txt" ||
          path === "/sitemap.xml";

        // Only treat as no-role when profile resolves to pending (empty/null → pending via resolveUserRole)
        const hasRole = resolved !== "pending";

        if (!hasRole && !skipPendingEnforce) {
          if (path !== "/choose-role" && !path.startsWith("/choose-role/")) {
            const out = NextResponse.redirect(new URL("/choose-role", req.url));
            copyCookies(res, out);
            return out;
          }
        }

        if (
          hasRole &&
          (path === "/choose-role" || path.startsWith("/choose-role/"))
        ) {
          const dest = getHomePathForResolvedRole(resolved);
          if (path !== dest && !path.startsWith(`${dest}/`)) {
            const out = NextResponse.redirect(new URL(dest, req.url));
            copyCookies(res, out);
            return out;
          }
        }
      }
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
  matcher: [
    "/dashboard/:path*",
    "/my-jobs/:path*",
    "/verifications/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/api/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!_next|favicon.ico).*)",
  ],
};
