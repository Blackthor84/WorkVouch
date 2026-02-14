/**
 * PATCH /api/admin/dispute/[id]
 * Update dispute (status, resolution). Only admins. Logs to dispute_actions and audit_logs.
 * Triggers trust score recalc when resolution affects employment/reference/fraud_flag/trust_score.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAudit, onDisputeResolvedAffectsTrust, refreshUserDisputeTransparency } from "@/lib/dispute-audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["open", "under_review", "resolved", "rejected"]).optional(),
  resolution_summary: z.string().max(2000).optional().nullable(),
  action_type: z.enum(["modify_record", "remove_flag", "restore_score", "confirm_original", "reverse_rehire_status"]).optional(),
  action_notes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const sb = getSupabaseServer() as any;

    const { data: existing, error: fetchErr } = await sb
      .from("disputes")
      .select("id, user_id, dispute_type, status, resolution_summary, resolved_by, resolved_at")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status;
      if (parsed.data.status === "resolved" || parsed.data.status === "rejected") {
        updates.resolution_summary = parsed.data.resolution_summary ?? existing.resolution_summary;
        updates.resolved_by = user.id;
        updates.resolved_at = new Date().toISOString();
      }
    }
    if (parsed.data.resolution_summary !== undefined) updates.resolution_summary = parsed.data.resolution_summary;

    const { error: updateErr } = await sb
      .from("disputes")
      .update(updates)
      .eq("id", id);

    if (updateErr) {
      console.error("[admin/dispute] update error:", updateErr);
      return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
    }

    if (parsed.data.action_type) {
      await sb.from("dispute_actions").insert({
        dispute_id: id,
        admin_id: user.id,
        action_type: parsed.data.action_type,
        action_notes: parsed.data.action_notes ?? null,
      });
    }

    await logAudit({
      entityType: "dispute",
      entityId: id,
      changedBy: user.id,
      oldValue: { status: existing.status, resolution_summary: existing.resolution_summary },
      newValue: updates,
      changeReason: parsed.data.action_notes ?? "Admin resolution",
    });

    if (updates.status === "resolved" || updates.status === "rejected") {
      await onDisputeResolvedAffectsTrust({
        userId: existing.user_id,
        disputeType: existing.dispute_type,
        adminId: user.id,
      });
      await refreshUserDisputeTransparency(existing.user_id);
    }

    const { data: updated } = await sb.from("disputes").select("*").eq("id", id).single();
    return NextResponse.json(updated ?? { id });
  } catch (e) {
    console.error("[admin/dispute] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
