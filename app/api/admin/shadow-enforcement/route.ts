import { NextRequest, NextResponse } from "next/server";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";
import {
  setShadowEnforcement,
  isShadowEnforcementEnabled,
} from "@/lib/admin/shadowMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/shadow-enforcement — set enforcement. Body: { enabled: boolean }. Admin-only. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSupabase();
  if (auth instanceof NextResponse) return auth;

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
  const auth = await requireAdminSupabase();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ enforced: isShadowEnforcementEnabled() });
}
