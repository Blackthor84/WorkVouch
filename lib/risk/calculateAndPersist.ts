/**
 * Risk Intelligence v1: gather profile data, compute RiskComponents, persist to profiles.
 * Uses service role. Call when verification completes, reference submitted, dispute resolved, rehire updated.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  calculateRiskComponents,
  type RiskComponents,
  type RiskEngineInput,
} from "./engine";

interface JobRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  verification_status?: string;
}

interface ReferenceRow {
  id: string;
  to_user_id: string;
  job_id: string;
}

interface DisputeRow {
  id: string;
  job_id: string;
  status: string;
}

interface RehireRow {
  profile_id: string;
  rehire_eligible: boolean;
}

/**
 * Gather required profile data and compute RiskComponents, then store on profiles.
 */
export async function calculateAndStoreRisk(profileId: string): Promise<{ error?: string }> {
  const supabase = getSupabaseServer() as unknown as {
    from: (table: string) => {
      select: (cols: string) => { eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>; in: (col: string, vals: string[]) => Promise<{ data: unknown; error: unknown }> };
      update: (row: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    };
  };

  const now = new Date().toISOString();

  // Jobs for this profile (tenure + gaps)
  const jobsResult = await supabase.from("jobs").select("id, user_id, start_date, end_date, verification_status").eq("user_id", profileId);
  const jobsData = jobsResult.data as JobRow[] | null;
  const jobsError = jobsResult.error;

  if (jobsError) {
    console.error("Risk: jobs fetch error", jobsError);
    return { error: String(jobsError) };
  }

  const jobs = (jobsData ?? []) as JobRow[];
  const verifiedJobs = jobs.filter(
    (j) => (j as JobRow & { verification_status?: string }).verification_status === "verified"
  );

  // References where this profile is the recipient
  const { data: refsData, error: refsError } = await supabase
    .from("references")
    .select("id, to_user_id, job_id")
    .eq("to_user_id", profileId);

  if (refsError) {
    console.error("Risk: references fetch error", refsError);
    return { error: String(refsError) };
  }

  const refs = (refsData ?? []) as ReferenceRow[];
  const jobIds = jobs.map((j) => j.id);

  // Disputes on this profile's jobs
  let disputesTotal = 0;
  let disputesResolved = 0;
  if (jobIds.length > 0) {
    const { data: disputesData } = await supabase
      .from("employer_disputes")
      .select("id, job_id, status")
      .in("job_id", jobIds);
    const disputes = (disputesData ?? []) as DisputeRow[];
    disputesTotal = disputes.length;
    disputesResolved = disputes.filter((d) => d.status === "resolved").length;
  }

  // Rehire: any employer marked rehire_eligible
  const { data: rehireData } = await supabase
    .from("rehire_registry")
    .select("profile_id, rehire_eligible")
    .eq("profile_id", profileId);
  const rehireRows = (rehireData ?? []) as RehireRow[];
  const rehireEligible = rehireRows.some((r) => r.rehire_eligible);

  // Tenure: from jobs
  const tenureJobs = jobs.map((j) => ({
    start_date: j.start_date,
    end_date: j.end_date,
  }));

  // Gaps: simple heuristic – sum tenure, assume gaps = 0 for now (or derive from date ranges)
  let totalTenureMonths = 0;
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  for (const j of sortedJobs) {
    const s = new Date(j.start_date).getTime();
    const e = j.end_date ? new Date(j.end_date).getTime() : Date.now();
    totalTenureMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
  }
  const totalMonthsGap = Math.max(0, 0); // placeholder; can compute from gaps between jobs

  const input: RiskEngineInput = {
    tenure: { jobs: tenureJobs },
    references: { total: Math.max(refs.length, 1), responded: refs.length },
    disputes: { total: disputesTotal, resolved: disputesResolved },
    gaps: { totalMonthsGap, totalTenureMonths },
    rehire: { rehireEligible },
    verifiedJobsCount: verifiedJobs.length,
    dataCompletenessBonus: jobs.length > 0 ? 5 : 0,
  };

  const components: RiskComponents = calculateRiskComponents(input);

  const update: Record<string, unknown> = {
    risk_snapshot: components,
    risk_score: components.overall,
    risk_score_version: components.version,
    risk_score_confidence: components.confidence,
    risk_last_calculated: now,
  };

  const { error: updateError } = await supabase.from("profiles").update(update).eq("id", profileId);

  if (updateError) {
    console.error("Risk: profile update error", updateError);
    return { error: String(updateError) };
  }

  return {};
}
