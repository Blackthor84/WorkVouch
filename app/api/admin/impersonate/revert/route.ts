import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearActingUserCookie } from "@/lib/auth/actingUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/impersonate/revert — clear impersonation cookies and redirect to /admin */
export async function GET() {
  await clearActingUserCookie();
  const cookieStore = await cookies();
  cookieStore.set("impersonatedUserId", "", { maxAge: 0, path: "/" });
  cookieStore.set("adminUserId", "", { maxAge: 0, path: "/" });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  return NextResponse.redirect(new URL("/admin", origin));
}
