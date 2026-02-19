/**
 * POST /api/admin/override/enable — founder-only, enable time-boxed production override.
 * Body: { durationMinutes: 15 | 30 | 60, reason: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { insertAdminAuditLog } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL?.trim()?.toLowerCase();
const ALLOWED_DURATIONS = [15, 30, 60] as const;

export async function POST(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (!admin.isAdmin) return adminForbiddenResponse();

  if (!FOUNDER_EMAIL) {
    return NextResponse.json(
      { error: "Founder override not configured (FOUNDER_EMAIL)" },
      { status: 503 }
    );
  }

  const callerEmail = (admin.email ?? "").trim().toLowerCase();
  if (callerEmail !== FOUNDER_EMAIL) {
    return NextResponse.json(
      { error: "Only the founder can enable production override" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : body.durationMinutes === "15" ? 15 : body.durationMinutes === "30" ? 30 : body.durationMinutes === "60" ? 60 : null;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (durationMinutes == null || !ALLOWED_DURATIONS.includes(durationMinutes as 15 | 30 | 60)) {
    return NextResponse.json(
      { error: "durationMinutes must be 15, 30, or 60" },
      { status: 400 }
    );
  }
  if (reason.length < 3) {
    return NextResponse.json(
      { error: "reason must be at least 3 characters" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer() as any;
  const { data: id, error } = await supabase.rpc("enable_admin_override", {
    duration_minutes: durationMinutes,
    reason,
    caller_email: admin.email ?? callerEmail,
    enabled_by: admin.userId,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to enable override" },
      { status: 400 }
    );
  }

  await insertAdminAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email ?? null,
    targetType: "system",
    targetId: id ?? null,
    action: "admin_override_enabled",
    newValue: { durationMinutes, reason, expiresIn: `${durationMinutes} minutes` },
    reason: `Production override enabled for ${durationMinutes} min. Reason: ${reason}`,
    adminRole: admin.isSuperAdmin ? "superadmin" : "admin",
    isSandbox: false,
  });

  return NextResponse.json({
    success: true,
    id,
    durationMinutes,
    message: `Override enabled for ${durationMinutes} minutes`,
  });
}
