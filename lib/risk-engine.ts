/**
 * Enterprise Risk Override Engine (Hidden, Locked, Non-UI).
 * Runs from Day 1; calculates silently; industry presets + optional company override.
 * Not visible in UI; not configurable by normal admins.
 * All reads/writes via service role server-side only.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export interface RiskModelConfig {
  tenure_weight: number;
  reference_weight: number;
  rehire_weight: number;
  dispute_weight: number;
  gap_weight: number;
  fraud_weight: number;
  override_enabled: boolean;
}

export interface RiskScoreInput {
  tenureScore: number;
  referenceRate: number;
  rehireLikelihood: number;
  disputeScore: number;
  gapScore: number;
  fraudScore: number;
  config: RiskModelConfig;
}

export interface RiskScoreResult {
  riskScore: number;
  breakdown: {
    tenure: number;
    references: number;
    rehire: number;
    disputes: number;
    gaps: number;
    fraud: number;
  };
}

const DEFAULT_WEIGHTS: RiskModelConfig = {
  tenure_weight: 1,
  reference_weight: 1,
  rehire_weight: 1,
  dispute_weight: 1,
  gap_weight: 1,
  fraud_weight: 1,
  override_enabled: false,
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));
const safeNum = (n: unknown, d: number): number => (Number.isFinite(Number(n)) ? Number(n) : d);

/**
 * Resolve risk model config: company override (if enterprise_override_enabled and override_enabled) else industry preset.
 * Service role only.
 */
export async function getRiskModelConfig(
  companyId: string | null,
  industryType: string
): Promise<RiskModelConfig> {
  const supabase = getSupabaseServer() as any;
  const industry = (industryType && String(industryType).trim()) || "general";

  if (companyId) {
    const { data: employer } = await supabase
      .from("employer_accounts")
      .select("enterprise_override_enabled")
      .eq("id", companyId)
      .maybeSingle();
    const overrideAllowed = (employer as { enterprise_override_enabled?: boolean } | null)?.enterprise_override_enabled === true;
    if (overrideAllowed) {
      const { data: override } = await supabase
        .from("risk_model_configs")
        .select("tenure_weight, reference_weight, rehire_weight, dispute_weight, gap_weight, fraud_weight, override_enabled")
        .eq("company_id", companyId)
        .eq("override_enabled", true)
        .maybeSingle();
      if (override) {
        return {
          tenure_weight: safeNum((override as any).tenure_weight, 1),
          reference_weight: safeNum((override as any).reference_weight, 1),
          rehire_weight: safeNum((override as any).rehire_weight, 1),
          dispute_weight: safeNum((override as any).dispute_weight, 1),
          gap_weight: safeNum((override as any).gap_weight, 1),
          fraud_weight: safeNum((override as any).fraud_weight, 1),
          override_enabled: true,
        };
      }
    }
  }

  const { data: preset } = await supabase
    .from("risk_model_configs")
    .select("tenure_weight, reference_weight, rehire_weight, dispute_weight, gap_weight, fraud_weight, override_enabled")
    .is("company_id", null)
    .eq("industry_type", industry)
    .maybeSingle();

  if (preset) {
    return {
      tenure_weight: safeNum((preset as any).tenure_weight, 1),
      reference_weight: safeNum((preset as any).reference_weight, 1),
      rehire_weight: safeNum((preset as any).rehire_weight, 1),
      dispute_weight: safeNum((preset as any).dispute_weight, 1),
      gap_weight: safeNum((preset as any).gap_weight, 1),
      fraud_weight: safeNum((preset as any).fraud_weight, 1),
      override_enabled: false,
    };
  }

  return DEFAULT_WEIGHTS;
}

/**
 * Weighted composite risk score 0–100. Uses config weights; normalizes so sum of weights scales to 0–100.
 */
export function calculateRiskScore(input: RiskScoreInput): RiskScoreResult {
  const { config, tenureScore, referenceRate, rehireLikelihood, disputeScore, gapScore, fraudScore } = input;
  const w = {
    tenure: safeNum(config.tenure_weight, 1),
    reference: safeNum(config.reference_weight, 1),
    rehire: safeNum(config.rehire_weight, 1),
    dispute: safeNum(config.dispute_weight, 1),
    gap: safeNum(config.gap_weight, 1),
    fraud: safeNum(config.fraud_weight, 1),
  };
  const tenure = clamp(tenureScore);
  const references = clamp(referenceRate * 100);
  const rehire = clamp(rehireLikelihood * 100);
  const disputes = clamp(disputeScore);
  const gaps = clamp(gapScore);
  const fraud = clamp(fraudScore);

  // Normalize weights to sum to 1
  const totalWeight =
    w.tenure +
    w.reference +
    w.rehire +
    w.dispute +
    w.gap +
    w.fraud;
  const scale = totalWeight > 0 ? 1 / totalWeight : 1;

  const weighted =
    tenure * w.tenure * scale +
    references * w.reference * scale +
    rehire * w.rehire * scale +
    disputes * w.dispute * scale +
    gaps * w.gap * scale +
    fraud * w.fraud * scale;

  // Convert to 0–100 score
  const riskScore = clamp(weighted);

  return {
    riskScore,
    breakdown: { tenure, references, rehire, disputes, gaps, fraud },
  };
}

/**
 * Gather worker metrics (tenure, reference rate, rehire, dispute, gap, fraud) then compute and store risk on the latest verification_report.
 * Call in background after report is recorded. Service role only.
 */
export async function updateRiskForVerificationReport(
  employerId: string,
  workerId: string
): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;

    const { data: reportRow } = await supabase
      .from("verification_reports")
      .select("id")
      .eq("employer_id", employerId)
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const reportId = (reportRow as { id?: string } | null)?.id;
    if (!reportId) return;

    const { data: employerRow } = await supabase
      .from("employer_accounts")
      .select("id, industry_key, industry")
      .eq("id", employerId)
      .maybeSingle();
    const industryType = (employerRow as { industry_key?: string; industry?: string } | null)?.industry_key
      || (employerRow as { industry?: string } | null)?.industry
      || "general";

    const config = await getRiskModelConfig(employerId, industryType);

    const { data: jobs } = await supabase.from("jobs").select("start_date, end_date").eq("user_id", workerId);
    const jobList = (jobs ?? []) as { start_date: string; end_date: string | null }[];
    let tenureMonths = 0;
    for (const j of jobList) {
      const s = new Date(j.start_date).getTime();
      const e = j.end_date ? new Date(j.end_date).getTime() : Date.now();
      if (e > s) tenureMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
    }
    const tenureScore = clamp(Math.min(100, (tenureMonths / 24) * 100));

    const { data: jobRows } = await supabase.from("jobs").select("id").eq("user_id", workerId);
    const jids = ((jobRows ?? []) as { id: string }[]).map((j) => j.id);
    let refTotal = 0;
    let refResponded = 0;
    if (jids.length > 0) {
      refTotal = jids.length;
      const { count } = await supabase.from("references").select("id", { count: "exact", head: true }).eq("to_user_id", workerId);
      refResponded = count ?? 0;
    }
    const referenceRate = refTotal > 0 ? refResponded / refTotal : 0;

    const { data: rehireRows } = await supabase.from("rehire_registry").select("rehire_eligible").eq("profile_id", workerId);
    const rehireLikelihood = ((rehireRows ?? []) as { rehire_eligible: boolean }[]).some((r) => r.rehire_eligible) ? 1 : 0;

    let disputeScoreVal = 100;
    if (jids.length > 0) {
      const { data: disp } = await supabase.from("employer_disputes").select("id, status").in("job_id", jids);
      const list = (disp ?? []) as { status: string }[];
      const open = list.filter((d) => d.status !== "resolved").length;
      disputeScoreVal = clamp(100 - open * 25 - list.length * 5);
    }

    const gapScore = 100;
    const fraudScore = 0;

    const result = calculateRiskScore({
      tenureScore,
      referenceRate,
      rehireLikelihood,
      disputeScore: disputeScoreVal,
      gapScore,
      fraudScore,
      config,
    });

    await supabase
      .from("verification_reports")
      .update({
        risk_score: result.riskScore,
        risk_metadata: result.breakdown as unknown as Record<string, unknown>,
      })
      .eq("id", reportId);
  } catch (e) {
    if (typeof console !== "undefined" && console.error) {
      console.error("[risk-engine] updateRiskForVerificationReport", e);
    }
  }
}

// ---------------------------------------------------------------------------
// Silent enterprise utilities. Do NOT render in UI. Internal use only.
// ---------------------------------------------------------------------------

export interface DepartmentRiskRow {
  department: string;
  avgRisk: number;
  employeeCount: number;
}

/**
 * Variance of department average risks vs overall average. Higher = more spread.
 * Internal only; not exposed in UI.
 */
export function calculateDepartmentVariance(
  departments: DepartmentRiskRow[],
  overallAverage: number
): number {
  if (departments.length === 0) return 0;
  const totalWeight = departments.reduce((s, d) => s + d.employeeCount, 0);
  if (totalWeight === 0) return 0;
  let weightedSqDiff = 0;
  for (const d of departments) {
    const diff = d.avgRisk - overallAverage;
    weightedSqDiff += (diff * diff) * (d.employeeCount / totalWeight);
  }
  return Math.round(Math.sqrt(weightedSqDiff) * 10) / 10;
}

export interface RoleRiskRow {
  role: string;
  avgRisk: number;
  employeeCount: number;
}

/**
 * Stability index: higher when more roles are in low-risk band (70+).
 * Internal only; not exposed in UI.
 */
export function calculateRoleStabilityIndex(roles: RoleRiskRow[]): number {
  if (roles.length === 0) return 0;
  const totalEmployees = roles.reduce((s, r) => s + r.employeeCount, 0);
  if (totalEmployees === 0) return 0;
  let stableWeight = 0;
  for (const r of roles) {
    if (r.avgRisk >= 70) stableWeight += r.employeeCount;
  }
  return Math.round((stableWeight / totalEmployees) * 1000) / 10;
}

/**
 * Risk velocity: change in average risk over recent periods (positive = improving).
 * Internal only; not exposed in UI.
 */
export function calculateRiskVelocity(monthlyAverages: { month: string; avgRisk: number }[]): number {
  if (monthlyAverages.length < 2) return 0;
  const sorted = [...monthlyAverages].sort((a, b) => a.month.localeCompare(b.month));
  const first = sorted[0].avgRisk;
  const last = sorted[sorted.length - 1].avgRisk;
  return Math.round((last - first) * 10) / 10;
}

/**
 * Placeholder for network density impact. Returns 0; reserved for future use.
 * Internal only; not exposed in UI.
 */
export function calculateNetworkDensityImpact(_payload: unknown): number {
  return 0;
}
