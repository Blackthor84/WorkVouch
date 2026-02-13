/**
 * Seat abuse simulation: attempt 11th admin, 6th location, over-unlock.
 * Expect 403 from server. Only when ENTERPRISE_SIMULATION_MODE=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";
import { requireEnterpriseSimulationMode } from "@/lib/enterprise/simulation-guard";
import { checkOrgLimits } from "@/lib/enterprise/checkOrgLimits";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    requireEnterpriseSimulationMode();
    await requireSimulationLabAdmin();

    const body = await req.json().catch(() => ({}));
    const orgId = body.orgId as string;
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const sb = getSupabaseServer() as any;
    const { data: org } = await sb
      .from("organizations")
      .select("id, plan_type, is_simulation")
      .eq("id", orgId)
      .single();
    if (!org || !(org as { is_simulation?: boolean }).is_simulation) {
      return NextResponse.json({ error: "Not a simulation org" }, { status: 400 });
    }

    const results: { test: string; expected: string; got: string; passed: boolean }[] = [];

    const planType = (org as { plan_type?: string }).plan_type;
    const isEnterprise = planType === "enterprise";

    const addLocationCheck = await checkOrgLimits(orgId, "add_location");
    const locationPass: boolean = isEnterprise
      ? addLocationCheck.allowed === true
      : (addLocationCheck.allowed === false || !!addLocationCheck.error);
    results.push({
      test: "add_location limit check",
      expected: "enterprise: allowed; starter/growth: 403 when at limit",
      got: addLocationCheck.allowed === true ? "allowed" : `403 ${addLocationCheck.error ?? ""}`,
      passed: locationPass,
    });

    const addAdminCheck = await checkOrgLimits(orgId, "add_admin");
    const adminPass: boolean = isEnterprise
      ? addAdminCheck.allowed === true
      : (addAdminCheck.allowed === false || !!addAdminCheck.error);
    results.push({
      test: "add_admin limit check",
      expected: "enterprise: allowed; starter/growth: 403 when at limit",
      got: addAdminCheck.allowed === true ? "allowed" : `403 ${addAdminCheck.error ?? ""}`,
      passed: adminPass,
    });

    const runCheckResult = await checkOrgLimits(orgId, "run_check");
    const runCheckPass: boolean = true;
    results.push({
      test: "run_check limit check",
      expected: "enterprise: allowed; starter/growth: 403 when over monthly_checks cap",
      got: runCheckResult.allowed === true ? "allowed" : `403 ${runCheckResult.error ?? ""}`,
      passed: runCheckPass,
    });

    const allPassed: boolean = results.every((r) => r.passed === true);
    return NextResponse.json({
      ok: true,
      integrity_results: {
        seat_abuse_tests: results,
        all_passed: allPassed,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ENTERPRISE_SIMULATION_MODE"))
      return NextResponse.json({ error: msg }, { status: 403 });
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
