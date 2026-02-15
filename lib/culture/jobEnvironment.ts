/**
 * Hidden job environment traits. Internal only.
 * Cursor logic: accept up to 3 trait keys, apply trust weighting, update SQL aggregates.
 * SQL never decides meaning. Decay applied on read only (never in SQL).
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { JobEnvironmentTraitKey } from "./constants";
import { JOB_ENVIRONMENT_TRAIT_KEYS } from "./constants";

const DECAY_HALFLIFE_DAYS = 180;

/** Decay on read only. SQL stores raw weighted_score; Cursor applies decay here or via cron/job. */
function decayFactor(lastUpdated: string): number {
  const days = (Date.now() - new Date(lastUpdated).getTime()) / (24 * 60 * 60 * 1000);
  return Math.pow(0.5, days / DECAY_HALFLIFE_DAYS);
}

export type EnvironmentFingerprint = {
  topTraits: { trait_key: string; weighted_score: number; vote_count: number }[];
  environment_confidence_score: number;
  environment_volatility_flag: boolean;
};

/**
 * Record a single vote. Trigger: after vouch, coworker confirmation, job verification.
 * Accepts up to 3 trait keys, applies trust weighting, updates SQL aggregates only.
 */
export async function recordJobEnvironmentVote(params: {
  jobId: string;
  traitKeys: JobEnvironmentTraitKey[];
  voterTrustWeight: number;
}): Promise<void> {
  if (params.traitKeys.length === 0) return;
  const sb = getSupabaseServer();
  const validKeys = params.traitKeys.filter((k) =>
    (JOB_ENVIRONMENT_TRAIT_KEYS as readonly string[]).includes(k)
  ).slice(0, 3);
  if (validKeys.length === 0) return;
  const weight = Math.max(0, Math.min(1, params.voterTrustWeight));
  for (const trait_key of validKeys) {
    const { data: row } = await sb
      .from("job_environment_traits")
      .select("id, weighted_score, vote_count")
      .eq("job_id", params.jobId)
      .eq("trait_key", trait_key)
      .maybeSingle();
    if (row) {
      await sb
        .from("job_environment_traits")
        .update({
          weighted_score: (row as { weighted_score: number }).weighted_score + weight,
          vote_count: (row as { vote_count: number }).vote_count + 1,
          last_updated: new Date().toISOString(),
        })
        .eq("id", (row as { id: string }).id);
    } else {
      await sb.from("job_environment_traits").insert({
        job_id: params.jobId,
        trait_key,
        weighted_score: weight,
        vote_count: 1,
        last_updated: new Date().toISOString(),
      });
    }
  }
}

/**
 * Get environment fingerprint for a job. Internal only.
 * Applies time decay to weighted scores; returns top traits, confidence, volatility.
 */
export async function getEnvironmentFingerprint(jobId: string): Promise<EnvironmentFingerprint | null> {
  const sb = getSupabaseServer();
  const { data: rows } = await sb
    .from("job_environment_traits")
    .select("trait_key, weighted_score, vote_count, last_updated")
    .eq("job_id", jobId);
  if (!rows || rows.length === 0) return null;
  const withDecay = (rows as { trait_key: string; weighted_score: number; vote_count: number; last_updated: string }[]).map(
    (r) => ({
      ...r,
      weighted_score: r.weighted_score * decayFactor(r.last_updated),
    })
  );
  withDecay.sort((a, b) => b.weighted_score - a.weighted_score);
  const topTraits = withDecay.slice(0, 3).map((r) => ({
    trait_key: r.trait_key,
    weighted_score: Math.round(r.weighted_score * 10000) / 10000,
    vote_count: r.vote_count,
  }));
  const totalVotes = withDecay.reduce((s, r) => s + r.vote_count, 0);
  const totalWeight = withDecay.reduce((s, r) => s + r.weighted_score, 0);
  const environment_confidence_score = totalVotes < 3 ? 0 : Math.min(1, totalWeight / (totalVotes * 0.5));
  const spread = withDecay.length > 1
    ? withDecay[0]!.weighted_score - (withDecay[withDecay.length - 1]?.weighted_score ?? 0)
    : 0;
  const environment_volatility_flag = withDecay.length >= 3 && spread < totalWeight * 0.3;
  return {
    topTraits,
    environment_confidence_score,
    environment_volatility_flag,
  };
}
