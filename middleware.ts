import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Comma-separated platform admin emails (no DB in middleware). Never throws. */
function getPlatformAdminEmails(): string[] {
  try {
    const raw = process.env.PLATFORM_ADMIN_EMAILS ?? process.env.ADMIN_EMAIL_ALLOWLIST ?? "";
    return raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Comma-separated read-only admin emails (no DB). */
function getPlatformReadOnlyEmails(): string[] {
  try {
    const raw = process.env.PLATFORM_READ_ONLY_EMAILS ?? "";
    return raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");

  let res = NextResponse.next({ request: req });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      }
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (isAdminRoute) {
      if (!session?.user) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      const email = session.user?.email?.trim()?.toLowerCase();
      const allowlist = getPlatformAdminEmails();
      const readOnlyList = getPlatformReadOnlyEmails();
      const allowedFull = allowlist.length > 0 && email ? allowlist.includes(email) : false;
      const allowedReadOnly = readOnlyList.length > 0 && email ? readOnlyList.includes(email) : false;
      if (!allowedFull && !allowedReadOnly && (allowlist.length > 0 || readOnlyList.length > 0)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return res;
  } catch {
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/((?!_next|favicon.ico|api).*)"],
};
