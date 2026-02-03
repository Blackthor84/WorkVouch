/**
 * Create a sandbox simulation session: sandbox_sessions + sandbox_profiles + sandbox_behavioral_profile_vector.
 * Supports mode: "standard" | "stress". Stress allows up to 10k candidates, batched inserts (500/batch).
 * Controlled variation via variationProfile (no Math.random). Baseline snapshots for drift detection.
 * Admin only. Never touches production tables. Asserts is_sandbox === true on every write.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const SANDBOX_TTL_MINUTES = 10;
const MODEL_VERSION = "behavioral_baseline_v1";
const BATCH_SIZE = 500;
const MAX_STANDARD = 500;
const MAX_STRESS = 10000;
const DRIFT_WARNING_THRESHOLD_PERCENT = 20;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

/** Isolation: throw if any write would go to production. */
function assertSandbox(isSandbox: boolean): void {
  if (isSandbox !== true) {
    throw new Error("Sandbox isolation violation: is_sandbox must be true for all sandbox writes.");
  }
}

/** Deterministic offset per index/dim: -2 to +2 (reproducible). */
function variance(index: number, dimension: number): number {
  return ((index * 7 + dimension * 11) % 5) - 2;
}

/** Gaussian-style deterministic offset in [-1, 1] from index/dim (no Math.random). */
function gaussianLike(index: number, dimension: number): number {
  const t = ((index * 17 + dimension * 31) % 1000) / 1000;
  return t * 2 - 1;
}

export interface VariationProfile {
  stabilityVariance?: number;
  pressureVariance?: number;
  integrityVariance?: number;
  leadershipVariance?: number;
}

export interface BehavioralPreset {
  avg_pressure?: number;
  avg_structure?: number;
  avg_communication?: number;
  avg_leadership?: number;
  avg_reliability?: number;
  avg_initiative?: number;
  conflict_risk_level?: number;
  tone_stability?: number;
  review_density_weight?: number;
}

const DEFAULT_PRESET: Required<BehavioralPreset> = {
  avg_pressure: 50,
  avg_structure: 50,
  avg_communication: 50,
  avg_leadership: 50,
  avg_reliability: 50,
  avg_initiative: 50,
  conflict_risk_level: 50,
  tone_stability: 50,
  review_density_weight: 50,
};

/** Fraud cluster: high density, low stability, high circularity, inflated endorsements (low integrity, high conflict). */
const FRAUD_CLUSTER_PRESET: BehavioralPreset = {
  avg_pressure: 75,
  avg_structure: 25,
  avg_communication: 40,
  avg_leadership: 30,
  avg_reliability: 20,
  avg_initiative: 35,
  conflict_risk_level: 80,
  tone_stability: 15,
  review_density_weight: 95,
};

function applyPreset(
  preset: BehavioralPreset | undefined,
  index: number,
  variationProfile?: VariationProfile,
  useFraudPreset?: boolean
): Required<BehavioralPreset> {
  const base = useFraudPreset
    ? { ...DEFAULT_PRESET, ...FRAUD_CLUSTER_PRESET }
    : { ...DEFAULT_PRESET, ...(preset && typeof preset === "object" ? preset : {}) };
  const v = variationProfile || {};
  const stabilityV = Math.max(0, Math.min(50, Number(v.stabilityVariance) || 0));
  const pressureV = Math.max(0, Math.min(50, Number(v.pressureVariance) || 0));
  const integrityV = Math.max(0, Math.min(50, Number(v.integrityVariance) || 0));
  const leadershipV = Math.max(0, Math.min(50, Number(v.leadershipVariance) || 0));
  const dims = [
    "avg_pressure",
    "avg_structure",
    "avg_communication",
    "avg_leadership",
    "avg_reliability",
    "avg_initiative",
    "conflict_risk_level",
    "tone_stability",
    "review_density_weight",
  ] as const;
  const out = { ...base };
  dims.forEach((d, i) => {
    let delta = variance(index, i);
    if (d === "tone_stability") delta += gaussianLike(index, 0) * stabilityV;
    if (d === "avg_pressure") delta += gaussianLike(index, 1) * pressureV;
    if (d === "avg_reliability" || d === "conflict_risk_level") delta += gaussianLike(index, 2) * integrityV;
    if (d === "avg_leadership") delta += gaussianLike(index, 3) * leadershipV;
    (out as Record<string, number>)[d] = clamp((base[d] ?? 50) + delta);
  });
  return out;
}

function computeBaselineFromRows(rows: Record<string, unknown>[]): Record<string, number> {
  if (rows.length === 0) return {};
  const sum = (key: string) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0);
  const keys = ["avg_pressure", "avg_structure", "avg_communication", "avg_leadership", "avg_reliability", "avg_initiative", "conflict_risk_level", "tone_stability"];
  const out: Record<string, number> = {};
  keys.forEach((k) => {
    const name = k === "conflict_risk_level" ? "avg_conflict_risk" : k === "tone_stability" ? "avg_tone_stability" : k;
    out[name] = clamp(sum(k === "conflict_risk_level" ? "conflict_risk_level" : k === "tone_stability" ? "tone_stability" : k) / rows.length);
  });
  return out;
}

function computeDeltaPercent(before: Record<string, number>, after: Record<string, number>): Record<string, number> {
  const delta: Record<string, number> = {};
  Object.keys(after).forEach((k) => {
    const b = before[k] ?? 0;
    const a = after[k] ?? 0;
    delta[k] = b === 0 ? (a === 0 ? 0 : 100) : Math.round(((a - b) / b) * 1000) / 10;
  });
  return delta;
}

function hasDriftWarning(deltaPercent: Record<string, number>): boolean {
  return Object.values(deltaPercent).some((d) => Math.abs(d) > DRIFT_WARNING_THRESHOLD_PERCENT);
}

export interface CreateSandboxSessionInput {
  industry: string;
  subIndustry?: string;
  roleTitle?: string;
  employerId?: string | null;
  candidateCount: number;
  behavioralPreset?: BehavioralPreset;
  variationProfile?: VariationProfile;
  mode?: "standard" | "stress";
  fraudClusterSimulation?: boolean;
  createdByAdmin: string;
}

export interface CreateSandboxSessionResult {
  sandboxSessionId: string;
  expiresAt: string;
  profileIds: string[];
  mode: "standard" | "stress";
  driftWarning?: boolean;
  executionTimeMs?: number;
  dbWriteTimeMs?: number;
  baselineSnapshot?: { baseline_before: Record<string, number>; baseline_after: Record<string, number>; delta_percent: Record<string, number> };
}

/**
 * Create sandbox session, N sandbox_profiles, and N sandbox_behavioral_profile_vector rows.
 * Stress mode: up to 10k candidates, 500 per batch. All rows is_sandbox = true, expires_at = now() + 10 min.
 * Asserts is_sandbox === true before every write.
 */
export async function createSandboxSession(
  input: CreateSandboxSessionInput
): Promise<CreateSandboxSessionResult | null> {
  const startTime = Date.now();
  let dbWriteTimeMs = 0;
  const {
    industry,
    subIndustry,
    roleTitle,
    employerId,
    candidateCount,
    behavioralPreset,
    variationProfile,
    mode = "standard",
    fraudClusterSimulation = false,
    createdByAdmin,
  } = input;

  const isStress = mode === "stress";
  const maxN = isStress ? MAX_STRESS : MAX_STANDARD;
  const n = Math.max(1, Math.min(maxN, Math.round(Number(candidateCount)) || 1));
  const expiresAt = new Date(Date.now() + SANDBOX_TTL_MINUTES * 60 * 1000).toISOString();
  assertSandbox(true);

  try {
    const supabase = getSupabaseServer() as any;
    const t0 = Date.now();
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("sandbox_sessions")
      .insert({
        created_by_admin: createdByAdmin,
        industry: industry || "corporate",
        sub_industry: subIndustry ?? null,
        role_title: roleTitle ?? null,
        employer_id: employerId ?? null,
        candidate_count: n,
        expires_at: expiresAt,
        is_sandbox: true,
        mode: isStress ? "stress" : "standard",
      })
      .select("id")
      .single();
    dbWriteTimeMs += Date.now() - t0;

    if (sessionErr || !sessionRow?.id) return null;
    const sandboxSessionId = sessionRow.id;
    const profileIds: string[] = [];
    let baselineBefore: Record<string, number> = {};
    const allVectorRows: Record<string, unknown>[] = [];

    const batchCount = Math.ceil(n / BATCH_SIZE);
    for (let b = 0; b < batchCount; b++) {
      const batchStart = b * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, n);
      const batchSize = batchEnd - batchStart;
      const profilePayloads = [];
      for (let i = batchStart; i < batchEnd; i++) {
        profilePayloads.push({
          sandbox_session_id: sandboxSessionId,
          created_by_admin: createdByAdmin,
          industry: industry || "corporate",
          sub_industry: subIndustry ?? null,
          role_title: roleTitle ?? null,
          expires_at: expiresAt,
          is_sandbox: true,
        });
      }
      assertSandbox(profilePayloads.every((p) => p.is_sandbox === true));
      const t1 = Date.now();
      const { data: insertedProfiles, error: batchProfileErr } = await supabase
        .from("sandbox_profiles")
        .insert(profilePayloads)
        .select("id");
      dbWriteTimeMs += Date.now() - t1;
      if (batchProfileErr || !insertedProfiles?.length) continue;
      const ids = (insertedProfiles as { id: string }[]).map((p) => p.id);
      profileIds.push(...ids);

      const vectorPayloads = ids.map((id, idx) => {
        const vec = applyPreset(behavioralPreset, batchStart + idx, variationProfile, fraudClusterSimulation);
        return {
          profile_id: id,
          avg_pressure: vec.avg_pressure,
          avg_structure: vec.avg_structure,
          avg_communication: vec.avg_communication,
          avg_leadership: vec.avg_leadership,
          avg_reliability: vec.avg_reliability,
          avg_initiative: vec.avg_initiative,
          conflict_risk_level: vec.conflict_risk_level,
          tone_stability: vec.tone_stability,
          review_density_weight: vec.review_density_weight,
          expires_at: expiresAt,
          is_sandbox: true,
        };
      });
      assertSandbox(vectorPayloads.every((p) => p.is_sandbox === true));
      const t2 = Date.now();
      await supabase.from("sandbox_behavioral_profile_vector").insert(vectorPayloads);
      dbWriteTimeMs += Date.now() - t2;
      vectorPayloads.forEach((v) => {
        allVectorRows.push({
          avg_pressure: v.avg_pressure,
          avg_structure: v.avg_structure,
          avg_communication: v.avg_communication,
          avg_leadership: v.avg_leadership,
          avg_reliability: v.avg_reliability,
          avg_initiative: v.avg_initiative,
          conflict_risk_level: v.conflict_risk_level,
          tone_stability: v.tone_stability,
        });
      });
      if (isStress && b === 0 && allVectorRows.length > 0) {
        baselineBefore = computeBaselineFromRows(allVectorRows);
      }
    }

    const rows = allVectorRows;
    if (rows.length > 0) {
      const sum = (key: string) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0);
      const avg = (key: string) => clamp(sum(key) / rows.length);
      const industryKey = (industry || "corporate").trim().toLowerCase();
      const payloadIndustry = {
        sandbox_session_id: sandboxSessionId,
        industry: industryKey,
        avg_pressure: avg("avg_pressure"),
        avg_structure: avg("avg_structure"),
        avg_communication: avg("avg_communication"),
        avg_leadership: avg("avg_leadership"),
        avg_reliability: avg("avg_reliability"),
        avg_initiative: avg("avg_initiative"),
        avg_conflict_risk: avg("conflict_risk_level"),
        avg_tone_stability: avg("tone_stability"),
        sample_size: rows.length,
        model_version: MODEL_VERSION,
        expires_at: expiresAt,
        is_sandbox: true,
      };
      assertSandbox(payloadIndustry.is_sandbox === true);
      const t3 = Date.now();
      await supabase.from("sandbox_industry_baselines").insert(payloadIndustry);
      dbWriteTimeMs += Date.now() - t3;
      if (employerId) {
        const payloadEmployer = {
          sandbox_session_id: sandboxSessionId,
          employer_id: employerId,
          avg_pressure: avg("avg_pressure"),
          avg_structure: avg("avg_structure"),
          avg_communication: avg("avg_communication"),
          avg_leadership: avg("avg_leadership"),
          avg_reliability: avg("avg_reliability"),
          avg_initiative: avg("avg_initiative"),
          avg_conflict_risk: avg("conflict_risk_level"),
          avg_tone_stability: avg("tone_stability"),
          employee_sample_size: rows.length,
          expires_at: expiresAt,
          is_sandbox: true,
        };
        assertSandbox(payloadEmployer.is_sandbox === true);
        await supabase.from("sandbox_employer_baselines").insert(payloadEmployer);
      }

      if (isStress && profileIds.length > 0) {
        const baselineAfter = computeBaselineFromRows(rows);
        const before = Object.keys(baselineAfter).length > 0 ? baselineBefore : baselineAfter;
        const deltaPercent = computeDeltaPercent(before, baselineAfter);
        const driftWarning = hasDriftWarning(deltaPercent);
        const snapshotPayload = {
          sandbox_session_id: sandboxSessionId,
          baseline_before: before,
          baseline_after: baselineAfter,
          delta_percent: deltaPercent,
          expires_at: expiresAt,
          is_sandbox: true,
        };
        assertSandbox(snapshotPayload.is_sandbox === true);
        await supabase.from("sandbox_baseline_snapshots").insert(snapshotPayload);
        const executionTimeMs = Date.now() - startTime;
        return {
          sandboxSessionId,
          expiresAt,
          profileIds,
          mode: "stress",
          driftWarning,
          executionTimeMs,
          dbWriteTimeMs,
          baselineSnapshot: { baseline_before: before, baseline_after: baselineAfter, delta_percent: deltaPercent },
        };
      }
    }

    const executionTimeMs = Date.now() - startTime;
    return {
      sandboxSessionId,
      expiresAt,
      profileIds,
      mode: isStress ? "stress" : "standard",
      executionTimeMs,
      dbWriteTimeMs,
    };
  } catch (e) {
    if (e instanceof Error && e.message.includes("Sandbox isolation")) throw e;
    return null;
  }
}

/**
 * Run cleanup of expired sandbox data (call before sandbox API responses if pg_cron not used).
 */
export async function runSandboxCleanup(): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;
    await supabase.rpc("cleanup_expired_sandbox_data");
  } catch {
    // non-fatal
  }
}
