// GET/POST /api/admin/control-center/trust — super_admin. GET: stats; POST: batch recalculate (best-effort).

import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/admin/requireSuperAdminApi";
import { admin } from "@/lib/supabase-admin";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrustUserRow = { user_id: string; score: number; full_name: string | null; email: string | null };

const safeEmpty = {
  distribution: [] as { bucket: string; count: number }[],
  topUsers: [] as TrustUserRow[],
  lowestUsers: [] as TrustUserRow[],
};

const BUCKET_LABELS = ["0–20", "20–40", "40–60", "60–80", "80–100"] as const;

async function attachNames(rows: { user_id: string; score: number }[]): Promise<TrustUserRow[]> {
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);
  const map = new Map<string, { full_name: string | null; email: string | null }>();
  for (const p of profiles ?? []) {
    map.set(p.id, { full_name: p.full_name, email: p.email });
  }
  return rows.map((r) => ({
    user_id: r.user_id,
    score: r.score,
    full_name: map.get(r.user_id)?.full_name ?? null,
    email: map.get(r.user_id)?.email ?? null,
  }));
}

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const { data: scores, error } = await admin.from("trust_scores").select("user_id, score");

    if (error || !scores?.length) {
      return NextResponse.json(safeEmpty);
    }

    const nums = scores.map((r) => Number(r.score)).filter((n) => !Number.isNaN(n));
    const distribution = BUCKET_LABELS.map((label, slot) => {
      const low = slot * 20;
      const high = slot === 4 ? 100 : (slot + 1) * 20;
      const count = nums.filter((s) =>
        slot === 4 ? s >= 80 && s <= 100 : s >= low && s < high
      ).length;
      return { bucket: label, count };
    });

    const sorted = [...scores].sort((a, b) => Number(b.score) - Number(a.score));
    const topRaw = sorted.slice(0, 10).map((r) => ({ user_id: r.user_id, score: Number(r.score) }));
    const lowRaw = [...sorted]
      .sort((a, b) => Number(a.score) - Number(b.score))
      .slice(0, 10)
      .map((r) => ({ user_id: r.user_id, score: Number(r.score) }));

    const [topUsers, lowestUsers] = await Promise.all([attachNames(topRaw), attachNames(lowRaw)]);

    return NextResponse.json({ distribution, topUsers, lowestUsers });
  } catch (e) {
    console.warn("[control-center/trust GET]", e);
    return NextResponse.json(safeEmpty);
  }
}

const BATCH_LIMIT = 30;

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(BATCH_LIMIT);

    if (error || !profiles?.length) {
      return NextResponse.json({ ok: true, processed: 0, message: "No users to process" });
    }

    let processed = 0;
    for (const p of profiles) {
      try {
        await calculateUserIntelligence(p.id);
        processed += 1;
      } catch (err) {
        console.warn("[control-center/trust POST] skip user", p.id, err);
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      message: `Recalculated up to ${BATCH_LIMIT} most recently created profiles.`,
    });
  } catch (e) {
    console.warn("[control-center/trust POST]", e);
    return NextResponse.json({ ok: false, processed: 0, message: "Recalculation failed" }, { status: 200 });
  }
}
