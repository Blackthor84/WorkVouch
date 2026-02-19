/**
 * GET /api/employer/candidate-risk?candidateId=<id>
 * Employer-only. Returns risk overlay data for a candidate (Career Health metrics plus
 * Rehire Likelihood, Reference Velocity, Risk Flag, Network Density, Fraud Cluster Confidence).
 * Values from profile_metrics when available; otherwise computed server-side. No raw weights exposed.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";

export const dynamic = "force-dynamic";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));

export type EmployerCandidateRiskResponse = {
  employmentStability: number;
  referenceStrength: number;
  documentationCompleteness: number;
  credentialValidation: number;
  disputeResolutionHistory: number;
  rehireLikelihoodIndex: number;
  referenceVelocityMetric: number;
  riskFlagIndicator: number;
  networkDensityScore: number;
  /** Internal metric; show numeric only with neutral label in UI. */
  fraudClusterConfidence: number;
};

async function computePlaceholders(
  candidateId: string,
  supabase: ReturnType<typeof getSupabaseServer>
): Promise<EmployerCandidateRiskResponse> {
  const sb = supabase as any;

  const { data: jobs } = await sb.from("jobs").select("id, start_date, end_date, verification_status").eq("user_id", candidateId);
  const jobList = (jobs ?? []) as { id: string; start_date: string; end_date: string | null; verification_status?: string }[];
  let tenureMonths = 0;
  for (const j of jobList) {
    const s = new Date(j.start_date).getTime();
    const e = j.end_date ? new Date(j.end_date).getTime() : Date.now();
    if (e > s) tenureMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
  }
  const employmentStability = clamp(Math.min(100, (tenureMonths / 24) * 100));

  const jids = jobList.map((j) => j.id);
  let refTotal = jids.length;
  let refResponded = 0;
  if (jids.length > 0) {
    const { count } = await sb.from("user_references").select("id", { count: "exact", head: true }).eq("to_user_id", candidateId);
    refResponded = count ?? 0;
  }
  const referenceStrength = refTotal > 0 ? clamp((refResponded / refTotal) * 100) : 100;

  const verified = jobList.filter((j) => j.verification_status === "verified").length;
  const documentationCompleteness = jobList.length > 0 ? clamp((verified / jobList.length) * 100) : 100;

  let credentialValidation = 0;
  try {
    const { data: cred } = await sb.from("guard_licenses").select("id").eq("user_id", candidateId);
    const credCount = Array.isArray(cred) ? cred.length : 0;
    credentialValidation = credCount > 0 ? Math.min(100, credCount * 25) : 0;
  } catch {
    // guard_licenses may not exist
  }
  const { data: profileRow } = await sb.from("profiles").select("guard_credential_score").eq("id", candidateId).maybeSingle();
  const guardScore = (profileRow as { guard_credential_score?: number | null } | null)?.guard_credential_score;
  if (guardScore != null && Number.isFinite(guardScore)) credentialValidation = clamp(guardScore);

  let disputeResolutionHistory = 100;
  if (jids.length > 0) {
    const { data: disp } = await sb.from("employer_disputes").select("id, status").in("job_id", jids);
    const list = (disp ?? []) as { status: string }[];
    const resolved = list.filter((d) => d.status === "resolved").length;
    const total = list.length;
    disputeResolutionHistory = total > 0 ? clamp((resolved / total) * 100) : 100;
  }

  const { data: rehireRows } = await sb.from("rehire_registry").select("rehire_eligible").eq("profile_id", candidateId);
  const rehireEligible = ((rehireRows ?? []) as { rehire_eligible: boolean }[]).some((r) => r.rehire_eligible);
  const rehireLikelihoodIndex = rehireEligible ? 85 : clamp(40 + Math.min(30, jobList.length * 10));

  const referenceVelocityMetric = refTotal > 0 ? clamp((refResponded / refTotal) * 100) : 0;

  const { data: vr } = await sb.from("verification_reports").select("risk_score").eq("worker_id", candidateId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const riskFromReport = (vr as { risk_score?: number | null } | null)?.risk_score;
  const riskFlagIndicator = riskFromReport != null && Number.isFinite(riskFromReport) ? clamp(100 - Number(riskFromReport)) : clamp((employmentStability + referenceStrength + disputeResolutionHistory) / 3);

  let networkDensityScore = 0;
  try {
    const { data: refs } = await sb.from("user_references").select("id").eq("to_user_id", candidateId);
    const refCount = Array.isArray(refs) ? refs.length : 0;
    const totalPossible = Math.max(jobList.length * 2, 1);
    networkDensityScore = clamp((refCount / totalPossible) * 100);
  } catch {
    // ignore
  }

  const fraudClusterConfidence = 0;

  return {
    employmentStability,
    referenceStrength,
    documentationCompleteness,
    credentialValidation,
    disputeResolutionHistory,
    rehireLikelihoodIndex,
    referenceVelocityMetric,
    riskFlagIndicator,
    networkDensityScore,
    fraudClusterConfidence,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 }
      );
    }

    const candidateId = req.nextUrl.searchParams.get("candidateId");
    if (!candidateId) return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });

    const supabaseAdmin = getSupabaseServer() as any;
    const { data: metricsRow } = await supabaseAdmin
      .from("profile_metrics")
      .select("stability_score, reference_score, rehire_score, dispute_score, credential_score, network_score, fraud_score")
      .eq("user_id", candidateId)
      .maybeSingle();

    let body: EmployerCandidateRiskResponse;
    if (metricsRow) {
      const m = metricsRow as {
        stability_score?: number | null;
        reference_score?: number | null;
        rehire_score?: number | null;
        dispute_score?: number | null;
        credential_score?: number | null;
        network_score?: number | null;
        fraud_score?: number | null;
      };
      body = {
        employmentStability: clamp(m.stability_score ?? 0),
        referenceStrength: clamp(m.reference_score ?? 0),
        documentationCompleteness: 0,
        credentialValidation: clamp(m.credential_score ?? 0),
        disputeResolutionHistory: clamp(m.dispute_score ?? 100),
        rehireLikelihoodIndex: clamp(m.rehire_score ?? 0),
        referenceVelocityMetric: clamp(m.reference_score ?? 0),
        riskFlagIndicator: clamp(100 - (m.stability_score ?? 50)),
        networkDensityScore: clamp(m.network_score ?? 0),
        fraudClusterConfidence: clamp(m.fraud_score ?? 0),
      };
      const { data: jobsData } = await supabaseAdmin.from("jobs").select("id, verification_status").eq("user_id", candidateId);
      const jobList = (jobsData ?? []) as { verification_status?: string }[];
      const verified = jobList.filter((j) => j.verification_status === "verified").length;
      body.documentationCompleteness = jobList.length > 0 ? clamp((verified / jobList.length) * 100) : 100;
    } else {
      body = await computePlaceholders(candidateId, supabaseAdmin);
    }

    return NextResponse.json(body);
  } catch (e) {
    console.error("Candidate risk error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
