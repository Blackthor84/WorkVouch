import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/impersonate — minimal. Sets impersonation_session cookie, returns { ok: true }.
 * Sibling routes status and exit read/clear the same cookie.
 */
export async function POST(req: Request) {
  let userId = "";
  try {
    const body = await req.json().catch(() => ({}));
    userId = typeof (body && (body as { userId?: unknown }).userId) === "string"
      ? (body as { userId: string }).userId
      : "";
  } catch {
    // leave userId empty
  }

  const cookieStore = await cookies();
  cookieStore.set(
    "impersonation_session",
    JSON.stringify({
      adminId: "",
      impersonatedUserId: userId || "unknown",
      startedAt: Date.now(),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    }
  );

  return NextResponse.json({ ok: true });
}
