// GET /api/admin/control-center/metrics — super_admin only. Safe fallbacks, no raw errors to client.

import { NextResponse } from "next/server";

import { requireSuperAdminApi "@/lib/admin/requireSuperAdminApi";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRUST_BUCKET_LABELS = ["0–20", "20–40", "40–60", "60–80", "80–100"] as const;

export type ControlCenterMetrics = {
  totalUsers: number;
  totalMatches: number;
  totalReviews: number;
  avgTrust: number;
  trustHistogram: { bucket: string; count: number }[];
};

const empty: ControlCenterMetrics = {
  totalUsers: 0,
  totalMatches: 0,
  totalReviews: 0,
  avgTrust: 0,
  trustHistogram: [],
};

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const [
      profilesRes,
      coworkerMatchRes,
      employmentMatchRes,
      coworkerRefRes,
      employmentRefRes,
      trustRes,
    ] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("coworker_matches").select("id", { count: "exact", head: true }),
      admin.from("employment_matches").select("id", { count: "exact", head: true }),
      admin.from("coworker_references").select("id", { count: "exact", head: true }),
      admin.from("employment_references").select("id", { count: "exact", head: true }),
      admin.from("trust_scores").select("score"),
    ]);

    const totalUsers = profilesRes.error ? 0 : profilesRes.count ?? 0;
    const cm = coworkerMatchRes.error ? 0 : coworkerMatchRes.count ?? 0;
    const em = employmentMatchRes.error ? 0 : employmentMatchRes.count ?? 0;
    const totalMatches = cm + em;

    const cr = coworkerRefRes.error ? 0 : coworkerRefRes.count ?? 0;
    const er = employmentRefRes.error ? 0 : employmentRefRes.count ?? 0;
    const totalReviews = cr + er;

    const scores: number[] = [];
    if (!trustRes.error && Array.isArray(trustRes.data)) {
      for (const row of trustRes.data) {
        const s = row && typeof row === "object" && "score" in row ? Number((row as { score: unknown }).score) : NaN;
        if (!Number.isNaN(s)) scores.push(s);
      }
    }
    const avgTrust =
      scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

    const histogram = TRUST_BUCKET_LABELS.map((label, i) => {
      const low = i * 20;
      const high = i === 4 ? 100 : (i + 1) * 20;
      const count = scores.filter((s) =>
        i === 4 ? s >= 80 && s <= 100 : s >= low && s < high
      ).length;
      return { bucket: label, count };
    });

    const payload: ControlCenterMetrics = {
      totalUsers,
      totalMatches,
      totalReviews,
      avgTrust,
      trustHistogram: histogram,
    };
    return NextResponse.json(payload);
  } catch (e) {
    console.warn("[control-center/metrics]", e);
    return NextResponse.json(empty);
  }
}
