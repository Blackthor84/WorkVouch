// DELETE / PATCH — super_admin. Moderate employment_references + coworker_references.

import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/admin/requireSuperAdminApi";
import { admin } from "@/lib/supabase-admin";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { calculateTrustScore } from "@/lib/trustScore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Source = "employment" | "coworker";

function resolveSource(req: NextRequest, body: unknown): Source {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("source") === "coworker") return "coworker";
  const b = body as { source?: string } | null;
  if (b?.source === "coworker") return "coworker";
  return "employment";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const source = resolveSource(req, body);

  if (!id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const { ipAddress, userAgent } = getAuditRequestMeta(req);

    if (source === "employment") {
      const { data: row } = await admin
        .from("employment_references")
        .select("id, reviewed_user_id, reviewer_id, rating, comment")
        .eq("id", id)
        .maybeSingle();

      if (!row) {
        return NextResponse.json({ ok: false }, { status: 404 });
      }

      const reviewedId = row.reviewed_user_id as string;
      const { error } = await admin.from("employment_references").delete().eq("id", id);
      if (error) {
        console.warn("[review DELETE employment]", error.message);
        return NextResponse.json({ ok: false }, { status: 200 });
      }
      await calculateUserIntelligence(reviewedId);
      await calculateTrustScore(reviewedId).catch((e) =>
        console.warn("[calculateTrustScore] admin review delete", e)
      );
      await insertAdminAuditLog({
        adminId: auth.userId,
        targetUserId: reviewedId,
        action: "peer_review_delete",
        oldValue: row as Record<string, unknown>,
        newValue: null,
        reason: "Admin moderation — employment reference removed",
        ipAddress,
        userAgent,
        adminRole: "superadmin",
      }).catch(() => {});
    } else {
      const { data: row } = await admin
        .from("coworker_references")
        .select("id, reviewed_id, reviewer_id, rating, comment")
        .eq("id", id)
        .maybeSingle();

      if (!row) {
        return NextResponse.json({ ok: false }, { status: 404 });
      }

      const reviewedId = row.reviewed_id as string;
      const { error } = await admin.from("coworker_references").delete().eq("id", id);
      if (error) {
        console.warn("[review DELETE coworker]", error.message);
        return NextResponse.json({ ok: false }, { status: 200 });
      }
      await admin.rpc("recalculate_trust_from_coworker_references", {
        p_user_id: reviewedId,
      }).catch(() => {});
      await calculateTrustScore(reviewedId).catch((e) =>
        console.warn("[calculateTrustScore] admin coworker review delete", e)
      );
      await insertAdminAuditLog({
        adminId: auth.userId,
        targetUserId: reviewedId,
        action: "peer_review_delete",
        oldValue: row as Record<string, unknown>,
        newValue: null,
        reason: "Admin moderation — coworker reference removed",
        ipAddress,
        userAgent,
        adminRole: "superadmin",
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn("[control-center/reviews DELETE]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    source?: Source;
    flagged?: boolean;
  };

  const source = body.source === "coworker" ? "coworker" : "employment";
  const flagged = body.flagged === true;

  if (!id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (source === "coworker") {
    return NextResponse.json({
      ok: false,
      message: "Flagging for coworker reviews is not available yet.",
    });
  }

  try {
    const { error } = await admin
      .from("employment_references")
      .update({ flagged })
      .eq("id", id);

    if (error) {
      console.warn("[review PATCH]", error.message);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await insertAdminAuditLog({
      adminId: auth.userId,
      targetType: "review",
      targetId: id,
      action: "content_flag_create",
      oldValue: {},
      newValue: { flagged },
      reason: flagged ? "Admin flagged employment reference" : "Admin cleared reference flag",
      ipAddress,
      userAgent,
      adminRole: "superadmin",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn("[control-center/reviews PATCH]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
