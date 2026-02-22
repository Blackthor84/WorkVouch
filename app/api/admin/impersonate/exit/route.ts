import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** POST /api/admin/impersonate/exit — clear impersonation_session cookie. */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: "impersonation_session", path: "/" });
  return NextResponse.json({ ok: true, redirectUrl: "/admin" });
}

/** GET — redirect to /admin after clearing cookie. */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete({ name: "impersonation_session", path: "/" });
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/admin", url.origin));
}
