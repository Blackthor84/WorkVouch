/**
 * POST /api/culture/environment-vote — record optional job environment traits (internal).
 * Triggered after vouch, match confirm, or job verification. No scores shown to user.
 * Voter must be a matched coworker for that job (employment_record).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { recordJobEnvironmentVote } from "@/lib/culture/jobEnvironment";
import type { JobEnvironmentTraitKey } from "@/lib/culture/constants";
import { JOB_ENVIRONMENT_TRAIT_KEYS, MAX_TRAITS_PER_VOTE } from "@/lib/culture/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidTraitKey(k: string): k is JobEnvironmentTraitKey {
  return (JOB_ENVIRONMENT_TRAIT_KEYS as readonly string[]).includes(k);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await supabaseServer();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const jobId = body.job_id ?? body.employment_record_id;
    const traitKeysRaw = Array.isArray(body.trait_keys) ? body.trait_keys : [];
    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json({ error: "job_id required" }, { status: 400 });
    }
    const traitKeys = traitKeysRaw
      .filter((k: unknown) => typeof k === "string" && isValidTraitKey(k))
      .slice(0, MAX_TRAITS_PER_VOTE) as JobEnvironmentTraitKey[];
    if (traitKeys.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const sb = getSupabaseServer();
    const { data: match } = await sb
      .from("employment_matches")
      .select("id")
      .eq("employment_record_id", jobId)
      .eq("matched_user_id", user.id)
      .eq("match_status", "confirmed")
      .maybeSingle();
    if (!match) {
      const { data: refs } = await sb
        .from("employment_references")
        .select("employment_match_id")
        .eq("reviewer_id", user.id);
      const matchIds = (refs ?? []).map((r: { employment_match_id: string }) => r.employment_match_id).filter(Boolean);
      if (matchIds.length === 0) {
        return NextResponse.json({ error: "Not authorized to vote for this job" }, { status: 403 });
      }
      const { data: m } = await sb
        .from("employment_matches")
        .select("id")
        .eq("employment_record_id", jobId)
        .in("id", matchIds)
        .limit(1)
        .maybeSingle();
      if (!m) {
        return NextResponse.json({ error: "Not authorized to vote for this job" }, { status: 403 });
      }
    }

    const { data: trustRow } = await sb
      .from("trust_scores")
      .select("score")
      .eq("user_id", user.id)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const voterTrustWeight = trustRow?.score != null ? Number(trustRow.score) / 100 : 0.5;

    await recordJobEnvironmentVote({
      jobId,
      traitKeys,
      voterTrustWeight,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[culture/environment-vote]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
