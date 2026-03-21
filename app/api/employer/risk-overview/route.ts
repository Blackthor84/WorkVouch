// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getUser } from "@/lib/auth/getUser";
import { checkFeatureAccess } from "@/lib/feature-flags";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";
import { resolveEmployerDataAccess } from "@/lib/employer/employerPlanServer";

export const dynamic = "force-dynamic";

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

    const access = await resolveEmployerDataAccess(user.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    if (access.mode === "free_preview") {
      return NextResponse.json({
        entitlements: {
          tier: access.plan,
          limitedPreview: true,
          upgradeUrl: "/enterprise/upgrade",
        },
        workforceRiskAverage: null,
        workforceHighRiskCount: 0,
        workforceRiskConfidence: null,
        workforceLastCalculated: null,
        riskSnapshotSample: null,
      });
    }

    const riskSnapshotEnabled = await checkFeatureAccess("risk_snapshot", { userId: user.id });
    const workforceDashboardEnabled = await checkFeatureAccess("workforce_dashboard", { userId: user.id });
    if (!riskSnapshotEnabled && !workforceDashboardEnabled) {
      return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });
    }

    type EmployerRow = { id: string };
    const eaResult = await admin
      .from("employer_accounts")
      .select("id")
      .eq("user_id", user.id)
      .returns<EmployerRow[]>();
    const eaList = eaResult.data ?? [];
    const ea = Array.isArray(eaList) ? eaList[0] : eaList;
    if (eaResult.error || !ea) {
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });
    }

    const employerId = ea.id;

    type RehireRow = { profile_id: string };
    const rrResult = await admin.from("rehire_registry").select("profile_id").eq("employer_id", employerId).returns<RehireRow[]>();
    const rrData = rrResult.data ?? [];
    const profileIds = rrData.map((r) => r.profile_id).slice(0, 1);
    let riskSnapshotSample: ProfileRiskRow["risk_snapshot"] = null;
    if (profileIds.length > 0) {
      const profResult = await admin.from("profiles").select("id, risk_snapshot").in("id", profileIds).returns<ProfileRiskRow[]>();
      const first = (profResult.data ?? [])[0];
      if (first?.risk_snapshot) riskSnapshotSample = first.risk_snapshot;
    }

    const baseData = {
      workforceRiskAverage: null as number | null,
      workforceHighRiskCount: 0,
      workforceRiskConfidence: null as number | null,
      workforceLastCalculated: null as string | null,
      riskSnapshotSample: riskSnapshotSample ?? null,
    };
    const authUser = await getUser();
    return NextResponse.json(applyScenario(baseData, (authUser as any)?.user_metadata?.impersonation));
  } catch (e) {
    console.error("Risk overview error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
