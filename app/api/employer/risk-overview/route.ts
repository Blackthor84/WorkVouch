import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { checkFeatureAccess } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

interface EmployerAccountRow {
  id: string;
  workforce_risk_average: number | null;
  workforce_high_risk_count: number | null;
  workforce_risk_confidence: number | null;
  workforce_last_calculated: string | null;
}

interface ProfileRiskRow {
  id: string;
  risk_snapshot: {
    tenure?: number;
    references?: number;
    disputes?: number;
    gaps?: number;
    rehire?: number;
    overall?: number;
    confidence?: number;
    version?: string;
  } | null;
}

/**
 * GET /api/employer/risk-overview
 * Returns workforce risk and optional sample risk_snapshot for UI. Gated by risk_snapshot or workforce_dashboard.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasEmployer = await hasRole("employer");
    if (!hasEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const riskSnapshotEnabled = await checkFeatureAccess("risk_snapshot", { userId: user.id });
    const workforceDashboardEnabled = await checkFeatureAccess("workforce_dashboard", { userId: user.id });
    if (!riskSnapshotEnabled && !workforceDashboardEnabled) {
      return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });
    }

    const supabase = getSupabaseServer() as unknown as {
      from: (table: string) => {
        select: (cols: string) => { eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>; in: (col: string, vals: string[]) => Promise<{ data: unknown; error: unknown }> };
      };
    };

    const eaResult = await supabase.from("employer_accounts").select("id, workforce_risk_average, workforce_high_risk_count, workforce_risk_confidence, workforce_last_calculated").eq("user_id", user.id);
    const ea = (Array.isArray(eaResult.data) ? eaResult.data[0] : eaResult.data) as EmployerAccountRow | undefined;
    if (eaResult.error || !ea) {
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });
    }

    const employerId = ea.id;

    // Optional: one profile's risk_snapshot for component bars (first from rehire_registry for this employer)
    const rrResult = await supabase.from("rehire_registry").select("profile_id").eq("employer_id", employerId);
    const rrData = (rrResult.data ?? []) as { profile_id: string }[];
    const profileIds = rrData.map((r) => r.profile_id).slice(0, 1);
    let riskSnapshotSample: ProfileRiskRow["risk_snapshot"] = null;
    if (profileIds.length > 0) {
      const profResult = await supabase.from("profiles").select("id, risk_snapshot").in("id", profileIds);
      const first = (Array.isArray(profResult.data) ? profResult.data[0] : profResult.data) as ProfileRiskRow | undefined;
      if (first?.risk_snapshot) riskSnapshotSample = first.risk_snapshot;
    }

    return NextResponse.json({
      workforceRiskAverage: ea.workforce_risk_average ?? null,
      workforceHighRiskCount: ea.workforce_high_risk_count ?? 0,
      workforceRiskConfidence: ea.workforce_risk_confidence ?? null,
      workforceLastCalculated: ea.workforce_last_calculated ?? null,
      riskSnapshotSample: riskSnapshotSample ?? null,
    });
  } catch (e) {
    console.error("Risk overview error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
