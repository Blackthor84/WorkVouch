// POST /api/admin/control-center/trust-override — super_admin. Upsert trust_scores (manual override).

import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/admin/requireSuperAdminApi";
import { admin } from "@/lib/supabase-admin";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      user_id?: string;
      score?: number;
      reason?: string;
    };

    const userId = typeof body.user_id === "string" ? body.user_id.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const scoreRaw = typeof body.score === "number" ? body.score : NaN;
    const score = Math.max(0, Math.min(100, Math.round(scoreRaw)));

    if (!userId || !reason || Number.isNaN(scoreRaw)) {
      return NextResponse.json({ ok: false, message: "user_id, score, and reason are required" }, { status: 400 });
    }

    const { data: existing } = await admin
      .from("trust_scores")
      .select("job_count, reference_count, average_rating, version")
      .eq("user_id", userId)
      .maybeSingle();

    const ex = existing as Record<string, unknown> | null;

    const { error } = await admin.from("trust_scores").upsert(
      {
        user_id: userId,
        score,
        job_count: typeof ex?.job_count === "number" ? ex.job_count : 0,
        reference_count: typeof ex?.reference_count === "number" ? ex.reference_count : 0,
        average_rating: typeof ex?.average_rating === "number" ? ex.average_rating : 0,
        calculated_at: new Date().toISOString(),
        version: `admin-override-${Date.now()}`,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.warn("[trust-override]", error.message);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await insertAdminAuditLog({
      adminId: auth.userId,
      targetUserId: userId,
      targetType: "trust_score",
      action: "trust_adjust",
      oldValue: existing ? { score: ex?.score, snapshot: ex } : null,
      newValue: { score },
      reason,
      ipAddress,
      userAgent,
      adminRole: "superadmin",
    }).catch((err) => console.warn("[trust-override] audit", err));

    return NextResponse.json({ ok: true, user_id: userId, score });
  } catch (e) {
    console.warn("[trust-override]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
