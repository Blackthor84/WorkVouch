import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import {
  setShadowEnforcement,
  isShadowEnforcementEnabled,
} from "@/lib/admin/shadowMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/shadow-enforcement — set enforcement. Body: { enabled: boolean }. Admin-only. */
export async function POST(req: NextRequest) {
  const authed = await getAuthedUser();
  if (!authed || (authed.role !== "admin" && authed.role !== "superadmin")) {
    return new NextResponse(null, { status: 403 });
  }

  let body: { enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  setShadowEnforcement(body.enabled === true);
  return NextResponse.json({ ok: true, enforced: body.enabled === true });
}

/** GET /api/admin/shadow-enforcement — return current enforcement. Admin-only. */
export async function GET() {
  const authed = await getAuthedUser();
  if (!authed || (authed.role !== "admin" && authed.role !== "superadmin")) {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.json({ enforced: isShadowEnforcementEnabled() });
}
