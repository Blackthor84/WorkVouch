/**
 * POST /api/admin/appeal/[id]/review
 * Review an appeal. Only admins. Body: { status: "approved" | "denied", notes?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAudit, onDisputeResolvedAffectsTrust, refreshUserDisputeTransparency } from "@/lib/dispute-audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["approved", "denied"]),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(
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

    const { id: appealId } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const sb = getSupabaseServer() as any;

    const { data: appeal, error: appealErr } = await sb
      .from("appeals")
      .select("id, dispute_id, user_id, status")
      .eq("id", appealId)
      .single();

    if (appealErr || !appeal) {
      return NextResponse.json({ error: "Appeal not found" }, { status: 404 });
    }

    if (appeal.status !== "pending") {
      return NextResponse.json({ error: "Appeal already reviewed" }, { status: 409 });
    }

    const { error: updateErr } = await sb
      .from("appeals")
      .update({
        status: parsed.data.status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", appealId);

    if (updateErr) {
      console.error("[admin/appeal] update error:", updateErr);
      return NextResponse.json({ error: "Failed to update appeal" }, { status: 500 });
    }

    const { data: dispute } = await sb
      .from("disputes")
      .select("id, user_id, dispute_type, status")
      .eq("id", appeal.dispute_id)
      .single();

    await logAudit({
      entityType: "dispute",
      entityId: appeal.dispute_id,
      changedBy: user.id,
      newValue: { appeal_id: appealId, appeal_review: parsed.data.status, notes: parsed.data.notes ?? null },
      changeReason: `Appeal ${parsed.data.status}: ${parsed.data.notes ?? ""}`,
    });

    if (dispute && (parsed.data.status === "approved" || parsed.data.status === "denied")) {
      await refreshUserDisputeTransparency(dispute.user_id);
      if (parsed.data.status === "approved") {
        await onDisputeResolvedAffectsTrust({
          userId: dispute.user_id,
          disputeType: dispute.dispute_type,
          adminId: user.id,
        });
      }
    }

    const { data: updated } = await sb
      .from("appeals")
      .select("id, status, reviewed_by, reviewed_at")
      .eq("id", appealId)
      .single();

    return NextResponse.json({
      appeal: updated,
      review_status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    });
  } catch (e) {
    console.error("[admin/appeal] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
