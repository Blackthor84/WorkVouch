import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { pickCompany, pickFullName, pickFrom } from "@/lib/sandbox/namePools";
import { INDUSTRIES } from "@/lib/constants/industries";
import { linkEmployeeToRandomEmployer } from "@/lib/sandbox/employmentGenerator";
import { generatePeerReviews } from "@/lib/sandbox/peerReviewGenerator";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";

export const dynamic = "force-dynamic";

async function parseBody<T>(req: Request): Promise<T> {
  return (await req.json()) as T;
}

const PRESETS = {
  fortune_500: { employers: 5, employees: 25 },
  startup: { employers: 1, employees: 6 },
  agency: { employers: 2, employees: 12 },
} as const;

export async function POST(req: NextRequest) {
  let body: { sandboxId?: string; sandbox_id?: string; preset?: string; employerCount?: number; employeeCount?: number };
  try {
    body = await parseBody<typeof body>(req);
  } catch {
    return NextResponse.json({ success: false, stage: "validation", error: "Invalid JSON body" }, { status: 400 });
  }
  console.log("PRESET BODY:", body);
  console.log("SANDBOX ID RECEIVED:", body.sandboxId);

  const sandboxId: string = (body.sandboxId ?? body.sandbox_id ?? "").trim();
  if (!sandboxId) {
    return NextResponse.json({ success: false, error: "sandboxId missing" }, { status: 400 });
  }
  const presetKey = (body.preset as keyof typeof PRESETS) || "startup";
  if (!PRESETS[presetKey]) {
    return NextResponse.json({ success: false, stage: "validation", error: "Invalid preset (fortune_500 | startup | agency)" }, { status: 400 });
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
        industry: pickFrom(INDUSTRIES),
        plan_tier: "pro",
      })
      .select("id")
      .single();
    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }
    employerIds.push(emp!.id);
  }
  console.log("Preset insert employers result:", employerIds.length, "sandbox_id:", sandboxId);

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
      console.error(error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }
    employeeIds.push({ id: emp!.id });
  }
  console.log("Preset insert employees result:", employeeIds.length, "sandbox_id:", sandboxId);

  for (const emp of employeeIds) {
    const links = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < links; i++) {
      await linkEmployeeToRandomEmployer({
        sandboxId: String(sandboxId),
        employeeId: String(emp.id),
      });
    }
    await generatePeerReviews({
      sandboxId: String(sandboxId),
      employeeId: String(emp.id),
      employeePool: employeeIds,
    });
  }

  await runSandboxIntelligenceRecalculation(String(sandboxId));
  await calculateSandboxMetrics(String(sandboxId));

  const { count } = await supabase
    .from("sandbox_employees")
    .select("*", { count: "exact", head: true })
    .eq("sandbox_id", sandboxId);
  console.log("EMPLOYEE COUNT AFTER INSERT:", count);

  const data = { preset: presetKey, employersCreated: employerCount, employeesCreated: employeeCount, employeeCountAfterInsert: count ?? null };
  return NextResponse.json({ success: true, data });
}
