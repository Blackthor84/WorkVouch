/**
 * POST /api/admin/content-flags/[id]/resolve — resolve a flag (approve, remove, escalate). Admin only. Audit logged.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["approve", "remove", "escalate"]),
  reason: z.string().optional(),
});

const ACTION_TO_STATUS: Record<"approve" | "remove" | "escalate", string> = {
  approve: "approved",
  remove: "removed",
  escalate: "escalated",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  try {
    const { id: flagId } = await params;
    if (!flagId) {
      return NextResponse.json({ error: "Missing flag id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "action must be approve, remove, or escalate" }, { status: 400 });
    }

    const { action, reason } = parsed.data;
    const status = ACTION_TO_STATUS[action];
    const isSandbox = await getAdminSandboxModeFromCookies();
    const { ipAddress, userAgent } = getAuditRequestMeta(req);

    const supabase = getSupabaseServer();

    const { data: existing, error: fetchError } = await supabase
      .from("content_flags")
      .select("id, content_type, content_id, reason, status")
      .eq("id", flagId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }

    if ((existing as { status: string }).status !== "open") {
      return NextResponse.json({ error: "Flag already resolved" }, { status: 400 });
    }

    const resolvedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("content_flags")
      .update({
        status,
        resolved_at: resolvedAt,
        resolved_by: admin.authUserId,
        resolution_action: action,
      })
      .eq("id", flagId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const reasonText = (reason?.trim() ?? "").slice(0, 500) || "(no reason provided)";
    await insertAdminAuditLog({
      adminId: admin.authUserId,
      adminEmail: (admin.user as { email?: string })?.email ?? null,
      targetType: "content_flag",
      targetId: flagId,
      action: "content_flag_resolve",
      oldValue: {
        content_type: (existing as { content_type: string }).content_type,
        content_id: (existing as { content_id: string }).content_id,
        previous_status: (existing as { status: string }).status,
      },
      newValue: { resolution_action: action, status, reason: reasonText },
      reason: reasonText,
      ipAddress,
      userAgent,
      adminRole: admin.isSuperAdmin ? "superadmin" : "admin",
      isSandbox,
    });

    return NextResponse.json({ success: true, status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg.startsWith("Audit log failed")) {
      return NextResponse.json({ error: "Audit failed" }, { status: 500 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
