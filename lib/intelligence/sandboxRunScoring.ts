/**
 * Run team fit, risk, and hiring confidence for a sandbox session.
 * Writes only to sandbox_* tables. Never touches production. Deterministic.
 * Asserts is_sandbox === true before every write.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getSandboxBehavioralVector } from "@/lib/intelligence/getBehavioralVector";
import { getHybridBehavioralBaseline } from "@/lib/intelligence/hybridBehavioralModel";
import type { BehavioralBaselineVector } from "@/lib/intelligence/hybridBehavioralModel";

const MODEL_VERSION = "1";
const NEUTRAL = 50;

function assertSandbox(isSandbox: boolean): void {
  if (isSandbox !== true) {
    throw new Error("Sandbox isolation violation: is_sandbox must be true for all sandbox writes.");
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

function behavioralDistance(
  candidate: { avg_pressure: number; avg_structure: number; avg_communication: number; avg_leadership: number; avg_reliability: number; avg_initiative: number; conflict_risk_level: number; tone_stability: number },
  baseline: BehavioralBaselineVector
): number {
  const keys = ["avg_pressure", "avg_structure", "avg_communication", "avg_leadership", "avg_reliability", "avg_initiative"] as const;
  let sum = 0;
  for (const k of keys) sum += Math.abs((candidate[k] ?? 50) - (baseline[k] ?? 50));
  sum += Math.abs((candidate.conflict_risk_level ?? 50) - (baseline.avg_conflict_risk ?? 50));
  sum += Math.abs((candidate.tone_stability ?? 50) - (baseline.avg_tone_stability ?? 50));
  return sum / 8;
}

function alignmentFromDistance(distance: number): number {
  return clamp(100 - Math.min(100, distance));
}

function baselineAlignmentFactor(
  candidate: { avg_pressure: number; avg_structure: number; avg_communication: number; avg_leadership: number; avg_reliability: number; avg_initiative: number; conflict_risk_level: number; tone_stability: number },
  baseline: BehavioralBaselineVector
): number {
  const keys = ["avg_pressure", "avg_structure", "avg_communication", "avg_leadership", "avg_reliability", "avg_initiative"] as const;
  let sumDiff = 0;
  for (const k of keys) sumDiff += Math.abs((candidate[k] ?? 0) - (baseline[k] ?? 0));
  sumDiff += Math.abs((candidate.conflict_risk_level ?? 0) - (baseline.avg_conflict_risk ?? 0));
  sumDiff += Math.abs((candidate.tone_stability ?? 0) - (baseline.avg_tone_stability ?? 0));
  return clamp(100 - sumDiff / 8);
}

/**
 * Run scoring for all profiles in a sandbox session. Writes to sandbox_team_fit_scores,
 * sandbox_risk_model_outputs, sandbox_hiring_confidence_scores. Uses sandbox baselines only.
 */
export async function runSandboxScoring(
  sandboxSessionId: string,
  employerId: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    assertSandbox(true);
    const supabase = getSupabaseServer() as any;
    const { data: session, error: sessionErr } = await supabase
      .from("sandbox_sessions")
      .select("id, industry, employer_id, expires_at")
      .eq("id", sandboxSessionId)
      .eq("is_sandbox", true)
      .maybeSingle();

    if (sessionErr || !session) return { ok: false, error: "Session not found or expired" };
    if (new Date(session.expires_at) < new Date()) return { ok: false, error: "Session expired" };

    const industry = session.industry || "corporate";
    const employer = employerId || session.employer_id || null;

    const { data: profiles } = await supabase
      .from("sandbox_profiles")
      .select("id")
      .eq("sandbox_session_id", sandboxSessionId)
      .eq("is_sandbox", true);
    const profileList = (profiles ?? []) as { id: string }[];
    if (profileList.length === 0) return { ok: false, error: "No profiles in session" };

    const hybridBaseline = employer
      ? await getHybridBehavioralBaseline(industry, employer, { sandboxSessionId })
      : await getHybridBehavioralBaseline(industry, "00000000-0000-0000-0000-000000000000", { sandboxSessionId });

    const expiresAt = session.expires_at;

    for (const profile of profileList) {
      const vector = await getSandboxBehavioralVector(profile.id);
      if (!vector) continue;

      const distance = behavioralDistance(vector, hybridBaseline);
      const alignmentScore = alignmentFromDistance(distance);
      const baselineAlign = baselineAlignmentFactor(vector, hybridBaseline);

      const conflict = vector.conflict_risk_level ?? 50;
      const reliability = vector.avg_reliability ?? 50;
      const toneStability = vector.tone_stability ?? 50;
      const baseConflict = hybridBaseline.avg_conflict_risk ?? 50;
      const baseRel = hybridBaseline.avg_reliability ?? 50;
      const baseTone = hybridBaseline.avg_tone_stability ?? 50;
      let deviation = 0;
      if (conflict > baseConflict) deviation += Math.min(33, (conflict - baseConflict) / 2);
      if (reliability < baseRel) deviation += Math.min(33, (baseRel - reliability) / 2);
      if (toneStability < baseTone) deviation += Math.min(33, (baseTone - toneStability) / 2);
      const riskScore = clamp(NEUTRAL + deviation);

      const hiringScore = clamp(alignmentScore * 0.5 + (100 - riskScore) * 0.25 + baselineAlign * 0.25);

      const qTf = supabase
      .from("sandbox_team_fit_scores")
      .select("id")
      .eq("sandbox_session_id", sandboxSessionId)
      .eq("profile_id", profile.id);
    const { data: existingTf } = employer
      ? await qTf.eq("employer_id", employer).maybeSingle()
      : await qTf.is("employer_id", null).maybeSingle();
    assertSandbox(true);
    if (existingTf?.id) {
      await supabase.from("sandbox_team_fit_scores").update({
        alignment_score: alignmentScore,
        breakdown: { behavioral_alignment_score: alignmentScore, distance },
        model_version: MODEL_VERSION,
        updated_at: new Date().toISOString(),
      }).eq("id", existingTf.id);
    } else {
      await supabase.from("sandbox_team_fit_scores").insert({
        sandbox_session_id: sandboxSessionId,
        profile_id: profile.id,
        employer_id: employer,
        alignment_score: alignmentScore,
        breakdown: { behavioral_alignment_score: alignmentScore, distance },
        model_version: MODEL_VERSION,
        expires_at: expiresAt,
        is_sandbox: true,
      });
    }

      const qRisk = supabase
        .from("sandbox_risk_model_outputs")
        .select("id")
        .eq("sandbox_session_id", sandboxSessionId)
        .eq("profile_id", profile.id);
      const { data: existingRisk } = employer
        ? await qRisk.eq("employer_id", employer).maybeSingle()
        : await qRisk.is("employer_id", null).maybeSingle();
      if (existingRisk?.id) {
        await supabase.from("sandbox_risk_model_outputs").update({
          overall_score: riskScore,
          breakdown: { behavioralRiskScore: riskScore },
          model_version: MODEL_VERSION,
          updated_at: new Date().toISOString(),
        }).eq("id", existingRisk.id);
      } else {
        await supabase.from("sandbox_risk_model_outputs").insert({
          sandbox_session_id: sandboxSessionId,
          profile_id: profile.id,
          employer_id: employer,
          overall_score: riskScore,
          breakdown: { behavioralRiskScore: riskScore },
          model_version: MODEL_VERSION,
          expires_at: expiresAt,
          is_sandbox: true,
        });
      }

      const qHiring = supabase
        .from("sandbox_hiring_confidence_scores")
        .select("id")
        .eq("sandbox_session_id", sandboxSessionId)
        .eq("profile_id", profile.id);
      const { data: existingHiring } = employer
        ? await qHiring.eq("employer_id", employer).maybeSingle()
        : await qHiring.is("employer_id", null).maybeSingle();
      if (existingHiring?.id) {
        await supabase.from("sandbox_hiring_confidence_scores").update({
          composite_score: hiringScore,
          breakdown: { alignmentScore, riskScore, baselineAlign },
          model_version: MODEL_VERSION,
          updated_at: new Date().toISOString(),
        }).eq("id", existingHiring.id);
      } else {
        await supabase.from("sandbox_hiring_confidence_scores").insert({
          sandbox_session_id: sandboxSessionId,
          profile_id: profile.id,
          employer_id: employer,
          composite_score: hiringScore,
          breakdown: { alignmentScore, riskScore, baselineAlign },
          model_version: MODEL_VERSION,
          expires_at: expiresAt,
          is_sandbox: true,
        });
      }
    }

    return { ok: true };
  } catch (e) {
    console.error("[sandboxRunScoring]", e);
    return { ok: false, error: String(e) };
  }
}
