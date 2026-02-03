/**
 * Workforce risk aggregation per employer.
 * Gets verified employees linked to employer, averages risk_score, counts high risk (< 50).
 * Uses employer_behavioral_baselines for reliability/conflict/tone trends. Service role.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEmployerBehavioralBaseline } from "@/lib/intelligence/hybridBehavioralModel";

interface VerificationRequestRow {
  job_id: string;
}

interface JobRow {
  id: string;
  user_id: string;
  verification_status: string;
}

interface ProfileRow {
  id: string;
  risk_score: number | null;
  risk_score_confidence: number | null;
}

/**
 * Get all verified employees linked to employer (via verification_requests for this employer's account).
 * Then average risk_score and count profiles with risk_score < 50.
 * Store workforce_risk_average, workforce_high_risk_count, workforce_last_calculated on employer_accounts.
 */
export async function calculateEmployerWorkforceRisk(employerId: string): Promise<{ error?: string }> {
  const supabase = getSupabaseServer() as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>;
        in: (col: string, vals: string[]) => Promise<{ data: unknown; error: unknown }>;
      };
      update: (row: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    };
  };

  const now = new Date().toISOString();

  // verification_requests where requested_by_id = employerId (employer_account id) and status = approved
  const vrResult = await supabase
    .from("verification_requests")
    .select("job_id")
    .eq("requested_by_id", employerId);

  const vrData = vrResult.data as VerificationRequestRow[] | null;
  const vrError = vrResult.error;
  if (vrError) {
    console.error("Workforce risk: verification_requests fetch error", vrError);
    return { error: String(vrError) };
  }

  const jobIds = [...new Set((vrData ?? []).map((r) => r.job_id))];
  if (jobIds.length === 0) {
    const { error: updateErr } = await supabase
      .from("employer_accounts")
      .update({
        workforce_risk_average: null,
        workforce_high_risk_count: 0,
        workforce_risk_confidence: null,
        workforce_last_calculated: now,
      })
      .eq("id", employerId);
    if (updateErr) return { error: String(updateErr) };
    return {};
  }

  // Jobs that are verified and in this list
  const jobsResult = await supabase.from("jobs").select("id, user_id, verification_status").in("id", jobIds);
  const jobs = (jobsResult.data ?? []) as JobRow[];
  const profileIds = [...new Set(jobs.filter((j) => j.verification_status === "verified").map((j) => j.user_id))];

  if (profileIds.length === 0) {
    const { error: updateErr } = await supabase
      .from("employer_accounts")
      .update({
        workforce_risk_average: null,
        workforce_high_risk_count: 0,
        workforce_last_calculated: now,
      })
      .eq("id", employerId);
    if (updateErr) return { error: String(updateErr) };
    return {};
  }

  // Get risk_score for these profiles
  const profilesResult = await supabase.from("profiles").select("id, risk_score").in("id", profileIds);
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const scores = profiles.map((p) => p.risk_score).filter((s): s is number => s != null && typeof s === "number");

  let average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const highRiskCount = scores.filter((s) => s < 50).length;

  const employerBaseline = await getEmployerBehavioralBaseline(employerId).catch(() => null);
  if (employerBaseline && employerBaseline.employee_sample_size > 0) {
    const rel = employerBaseline.avg_reliability ?? 50;
    const conflict = employerBaseline.avg_conflict_risk ?? 50;
    const tone = employerBaseline.avg_tone_stability ?? 50;
    const behavioralRisk = Math.max(0, Math.min(100, (100 - rel + conflict + (100 - tone)) / 3));
    average = average != null ? average * 0.9 + behavioralRisk * 0.1 : behavioralRisk;
  }

  const { error: updateError } = await supabase
    .from("employer_accounts")
    .update({
      workforce_risk_average: average,
      workforce_high_risk_count: highRiskCount,
      workforce_last_calculated: now,
    })
    .eq("id", employerId);

  if (updateError) {
    console.error("Workforce risk: employer_accounts update error", updateError);
    return { error: String(updateError) };
  }

  return {};
}
