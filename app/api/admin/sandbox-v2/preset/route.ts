import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { pickCompany, pickIndustry, pickFullName, pickFrom, INDUSTRIES } from "@/lib/sandbox/namePools";
import { linkEmployeeToRandomEmployer } from "@/lib/sandbox/employmentGenerator";
import { generatePeerReviews } from "@/lib/sandbox/peerReviewGenerator";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";

export const dynamic = "force-dynamic";

const PRESETS = {
  fortune_500: { employers: 5, employees: 25 },
  startup: { employers: 1, employees: 6 },
  agency: { employers: 2, employees: 12 },
} as const;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }
  const sandboxId = body.sandboxId ?? body.sandbox_id;
  const presetKey = body.preset as keyof typeof PRESETS | undefined;

  if (!sandboxId) {
    return NextResponse.json({ success: false, stage: "validation", error: "Missing sandboxId" }, { status: 400 });
  }
  if (!presetKey || !PRESETS[presetKey]) {
    return NextResponse.json({ success: false, stage: "validation", error: "Missing or invalid preset (fortune_500 | startup | agency)" }, { status: 400 });
  }

  try {
    await requireSandboxV2Admin();
  } catch (authError) {
    const err = authError as { message?: string };
    console.error("Preset route auth error:", authError);
    return NextResponse.json({ success: false, stage: "auth", error: err?.message ?? "Unknown" }, { status: 500 });
  }

  const supabase = getServiceRoleClient();
  const { employers: employerCount, employees: employeeCount } = PRESETS[presetKey];

  const employerIds: string[] = [];
  for (let i = 0; i < employerCount; i++) {
    const { data: emp, error } = await supabase
      .from("sandbox_employers")
      .insert({
        sandbox_id: sandboxId,
        company_name: pickCompany(),
        industry: pickIndustry(),
        plan_tier: "pro",
      })
      .select("id")
      .single();
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ success: false, stage: "supabase_insert", error: error.message, details: error }, { status: 500 });
    }
    employerIds.push(emp.id);
  }

  const employeeIds: { id: string }[] = [];
  for (let i = 0; i < employeeCount; i++) {
    const { data: emp, error } = await supabase
      .from("sandbox_employees")
      .insert({
        sandbox_id: sandboxId,
        full_name: pickFullName(),
        industry: pickFrom(INDUSTRIES),
      })
      .select("id")
      .single();
    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ success: false, stage: "supabase_insert", error: error.message, details: error }, { status: 500 });
    }
    employeeIds.push({ id: emp.id });
  }

  for (const emp of employeeIds) {
    const links = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < links; i++) {
      await linkEmployeeToRandomEmployer({ sandboxId, employeeId: emp.id });
    }
    await generatePeerReviews({ sandboxId, employeeId: emp.id, employeePool: employeeIds });
  }

  await runSandboxIntelligenceRecalculation(sandboxId);
  await calculateSandboxMetrics(sandboxId);

  return NextResponse.json({
    success: true,
    preset: presetKey,
    employersCreated: employerCount,
    employeesCreated: employeeCount,
  });
}
