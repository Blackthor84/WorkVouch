import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/lib/auth";

export const runtime = "nodejs";

/** POST /api/admin/impersonate/exit — clear impersonation_session cookie. Admin-only. */
export async function POST() {
  if (!(await hasRole("admin")) && !(await hasRole("superadmin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.delete({ name: "impersonation_session", path: "/" });
  return NextResponse.json({ ok: true, redirectUrl: "/admin" });
}

/** GET — redirect to /admin after clearing cookie. Admin-only. */
export async function GET(request: Request) {
  if (!(await hasRole("admin")) && !(await hasRole("superadmin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.delete({ name: "impersonation_session", path: "/" });
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/admin", url.origin));
}
