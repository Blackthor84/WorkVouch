import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";

/** GET: full intelligence breakdown for user (admin only). Tenure, volume, sentiment, rating, rehire, raw, final, version. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const _session = await requireAdminForApi();
  if (!_session) return adminForbiddenResponse();
  try {
    const { id: userId } = await params;
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    const supabase = getSupabaseServer();
    const { data: snap } = await supabase
      .from("intelligence_snapshots")
      .select("profile_strength, career_health_score, tenure_score, reference_score, rehire_score, dispute_score, network_density_score, last_calculated_at, model_version")
      .eq("user_id", userId)
      .is("is_simulation", null)
      .maybeSingle();
    if (!snap) return NextResponse.json({ breakdown: null, message: "No snapshot" });
    const row = snap as Record<string, unknown>;
    const breakdown = {
      tenureStrength: row.tenure_score ?? 0,
      volumeStrength: row.reference_score ?? 0,
      sentimentStrength: row.dispute_score ?? 0,
      ratingStrength: row.reference_score ?? 0,
      rehireMultiplier: row.rehire_score ?? 0,
      rawScore: row.career_health_score ?? 0,
      finalScore: row.profile_strength ?? 0,
      versionUsed: row.model_version ?? "v1",
      lastCalculatedAt: row.last_calculated_at ?? null,
    };
    return NextResponse.json({ breakdown });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
