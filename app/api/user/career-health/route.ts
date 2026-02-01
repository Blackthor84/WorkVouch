/**
 * GET /api/user/career-health
 * Employee-only. Returns career health metrics for dashboard: employment stability, reference strength,
 * documentation completeness, credential validation, dispute resolution. Computed server-side from risk_snapshot and jobs/credentials.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

type RiskSnapshot = {
  tenure?: number;
  references?: number;
  disputes?: number;
  gaps?: number;
  rehire?: number;
};

export type CareerHealthResponse = {
  employmentStability: number;
  referenceStrength: number;
  documentationCompleteness: number;
  credentialValidation: number;
  disputeResolutionHistory: number;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = await createServerSupabase();

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("risk_snapshot, guard_credential_score")
      .eq("id", userId)
      .maybeSingle();

    const snapshot = (profileRow as { risk_snapshot?: RiskSnapshot } | null)?.risk_snapshot;
    const guardCredentialScore = (profileRow as { guard_credential_score?: number | null } | null)?.guard_credential_score;

    if (profileError) {
      return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
    }

    const employmentStability = clamp(snapshot?.tenure ?? 0);
    const referenceStrength = clamp(snapshot?.references ?? 0);
    const disputeResolutionHistory = clamp(snapshot?.disputes ?? 100);

    let documentationCompleteness = 100;
    try {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, verification_status")
        .eq("user_id", userId)
        .returns<JobRow[]>();
      const jobs = Array.isArray(jobsData) ? jobsData : [];
      const total = jobs.length;
      const verified = jobs.filter((j) => j.verification_status === "verified").length;
      documentationCompleteness = total > 0 ? clamp((verified / total) * 100) : 100;
    } catch {
      // jobs table may not exist or RLS may block
    }

    let credentialValidation = clamp(guardCredentialScore ?? 0);
    if (credentialValidation === 0) {
      try {
        const { data: credData } = await supabase.from("guard_licenses").select("id").eq("user_id", userId);
        const count = Array.isArray(credData) ? credData.length : 0;
        credentialValidation = count > 0 ? Math.min(100, count * 25) : 0;
      } catch {
        // guard_licenses may not exist
      }
    }

    const body: CareerHealthResponse = {
      employmentStability,
      referenceStrength,
      documentationCompleteness,
      credentialValidation,
      disputeResolutionHistory,
    };

    return NextResponse.json(body);
  } catch (e) {
    console.error("Career health error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
