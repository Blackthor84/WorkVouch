import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  full_name: string | null;
  trust_score: number | null;
  headline: string | null;
};

/**
 * GET /api/lab/hiring-simulator-candidates
 * Worker-shaped profiles for hiring risk lab + optional trust/job/coworker counts.
 */
export async function GET(req: Request) {
  console.log("[API HIT]", req.url);
  try {
    const { data: rawProfiles, error } = await admin
      .from("profiles")
      .select("id, full_name, trust_score, headline")
      .is("deleted_at", null)
      .or("role.eq.candidate,role.eq.employee,role.eq.user,role.is.null")
      .order("trust_score", { ascending: false })
      .limit(48);

    if (error) {
      console.error("[API ERROR]", error.message);
      return NextResponse.json(
        { candidates: [], error: error.message },
        { status: 500 },
      );
    }

    const profiles = (rawProfiles ?? []) as ProfileRow[];
    const ids = profiles.map((p) => p.id);
    if (ids.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    const [trustRes, jobsRes, empPeerRes, cowPeerRes] = await Promise.all([
      admin.from("trust_scores").select("user_id, score").in("user_id", ids),
      admin.from("jobs").select("user_id").in("user_id", ids).eq("is_private", false),
      admin
        .from("employment_references")
        .select("reviewed_user_id")
        .in("reviewed_user_id", ids),
      admin.from("coworker_references").select("reviewed_id").in("reviewed_id", ids),
    ]);

    const trustFromTable: Record<string, number> = {};
    for (const r of (trustRes.data ?? []) as { user_id: string; score: number | null }[]) {
      trustFromTable[r.user_id] = Number(r.score ?? 0);
    }

    const jobCounts: Record<string, number> = {};
    for (const r of (jobsRes.data ?? []) as { user_id: string }[]) {
      jobCounts[r.user_id] = (jobCounts[r.user_id] ?? 0) + 1;
    }

    const coworkerCounts: Record<string, number> = {};
    for (const r of (empPeerRes.data ?? []) as { reviewed_user_id: string }[]) {
      coworkerCounts[r.reviewed_user_id] =
        (coworkerCounts[r.reviewed_user_id] ?? 0) + 1;
    }
    for (const r of (cowPeerRes.data ?? []) as { reviewed_id: string }[]) {
      coworkerCounts[r.reviewed_id] = (coworkerCounts[r.reviewed_id] ?? 0) + 1;
    }

    const candidates = profiles.map((p) => {
      const mergedTrust =
        p.trust_score != null && Number.isFinite(Number(p.trust_score))
          ? Number(p.trust_score)
          : (trustFromTable[p.id] ?? null);

      return {
        id: p.id,
        full_name: p.full_name,
        trust_score: mergedTrust,
        headline: p.headline,
        verified_coworkers_count: coworkerCounts[p.id] ?? 0,
        verified_jobs_count: jobCounts[p.id] ?? 0,
      };
    });

    return NextResponse.json({ candidates });
  } catch (e) {
    console.error("[API ERROR]", e);
    return NextResponse.json({ candidates: [] }, { status: 500 });
  }
}
