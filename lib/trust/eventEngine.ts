/**
 * Trust Event Engine.
 * Production-safe: base trust_events schema uses payload only until engine columns migrate.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { Json } from "@/types/supabase";
import { getTrustTrajectory } from "@/lib/trust/trustTrajectory";
import { isMissingColumnError } from "@/lib/supabase/postgrestErrors";

export type TrustEventSource =
  | "employment_verification"
  | "reference_creation"
  | "verification_request_accepted"
  | "dispute_resolution"
  | "credential_sharing"
  | string;

export type EmitTrustEventParams = {
  profile_id: string;
  event_type: string;
  event_source: TrustEventSource;
  impact_score: number;
  metadata?: Record<string, unknown>;
};

const supabase = () => getSupabaseServer() as ReturnType<typeof getSupabaseServer>;

export async function emitTrustEvent(params: EmitTrustEventParams): Promise<void> {
  const { profile_id, event_type, event_source, impact_score, metadata } = params;
  const payload = metadata ?? {};
  const impact =
    impact_score > 0 ? "positive" : impact_score < 0 ? "negative" : "neutral";

  const extendedInsert = {
    profile_id,
    event_type,
    event_source,
    impact_score: Number(impact_score),
    metadata: payload as unknown as Json,
    payload: payload as unknown as Json,
    impact,
  };

  const { error: extendedError } = await supabase().from("trust_events").insert(extendedInsert);
  if (!extendedError) return;

  if (!isMissingColumnError(extendedError)) {
    console.error("[trust/eventEngine] emitTrustEvent", extendedError);
    return;
  }

  const { error: baseError } = await supabase().from("trust_events").insert({
    profile_id,
    event_type,
    payload: {
      ...payload,
      event_source,
      impact_score: Number(impact_score),
      impact,
    } as unknown as Json,
  });

  if (baseError) {
    console.error("[trust/eventEngine] emitTrustEvent fallback", baseError);
  }
}

export type TrustScoreBand = "low" | "medium" | "high";

export type CalculateTrustScoreResult = {
  score: number;
  band: TrustScoreBand;
  trajectory: "improving" | "stable" | "at_risk";
  trajectoryLabel: string;
};

const MIN_SCORE = 0;
const MAX_SCORE = 100;

function scoreToBand(raw: number): TrustScoreBand {
  const clamped = Math.max(MIN_SCORE, Math.min(MAX_SCORE, raw));
  if (clamped < 34) return "low";
  if (clamped < 67) return "medium";
  return "high";
}

function impactFromPayload(payload: Record<string, unknown> | null | undefined): number {
  if (!payload) return 0;
  const direct = payload.impact_score;
  if (typeof direct === "number") return direct;
  if (typeof direct === "string" && direct.trim() !== "") return Number(direct) || 0;
  const impact = String(payload.impact ?? "").toLowerCase();
  if (impact === "positive") return 5;
  if (impact === "negative") return -5;
  return 0;
}

export async function calculateTrustScore(profileId: string): Promise<CalculateTrustScoreResult> {
  const sb = supabase();
  const extended = await sb
    .from("trust_events")
    .select("impact_score")
    .eq("profile_id", profileId);

  let rawSum = 0;
  if (!extended.error) {
    const list = (extended.data ?? []) as { impact_score?: number | string }[];
    rawSum = list.reduce((acc, r) => acc + Number(r.impact_score ?? 0), 0);
  } else if (isMissingColumnError(extended.error)) {
    const base = await sb
      .from("trust_events")
      .select("payload")
      .eq("profile_id", profileId);
    if (base.error) {
      console.error("[trust/eventEngine] calculateTrustScore", base.error);
    } else {
      rawSum = (base.data ?? []).reduce(
        (acc, row) => acc + impactFromPayload((row as { payload?: Record<string, unknown> }).payload),
        0
      );
    }
  } else {
    console.error("[trust/eventEngine] calculateTrustScore", extended.error);
  }

  const score = Math.round(Math.max(MIN_SCORE, Math.min(MAX_SCORE, 50 + rawSum)));
  const band = scoreToBand(score);

  let trajectory: CalculateTrustScoreResult["trajectory"] = "stable";
  let trajectoryLabel = "Stable";
  try {
    const traj = await getTrustTrajectory(profileId);
    trajectory = traj.trajectory;
    trajectoryLabel = traj.label;
  } catch {
    // keep defaults
  }

  return {
    score,
    band,
    trajectory,
    trajectoryLabel,
  };
}
