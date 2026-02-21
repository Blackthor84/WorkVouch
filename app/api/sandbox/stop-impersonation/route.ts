import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";

const COOKIE_NAME = "sandbox_playground_impersonation";

/** POST /api/sandbox/stop-impersonation — clear sandbox impersonation cookie and redirect to /dashboard. Superadmin only. */
export async function POST(req: NextRequest) {
  const forbidden = await requireSuperadmin();
  if (forbidden) return forbidden;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
