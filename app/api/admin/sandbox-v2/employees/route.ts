import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { linkEmployeeToRandomEmployer } from "@/lib/sandbox/employmentGenerator";
import { generatePeerReviews } from "@/lib/sandbox/peerReviewGenerator";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { pickFullName, pickIndustry } from "@/lib/sandbox/namePools";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }
  console.log("BODY:", body);

  const sandboxId = body.sandboxId ?? body.sandbox_id;
  if (!sandboxId) {
    return NextResponse.json({ success: false, error: "Missing sandboxId" }, { status: 400 });
  }

  try {
    await requireSandboxV2Admin();
  } catch (authError) {
    const err = authError as { message?: string };
    console.error("EMPLOYEES ROUTE ERROR", authError);
    return NextResponse.json({
      success: false,
      stage: "employees_route",
      error: err?.message ?? "Unknown",
      details: authError,
    }, { status: 500 });
  }

  try {
    const supabase = getServiceRoleClient();
    const sandbox_id = sandboxId;
    const first = body.first_name ?? body.firstName;
    const last = body.last_name ?? body.lastName;
    const full_name =
      body.full_name ?? body.fullName ??
      (first != null && last != null ? `${first} ${last}` : pickFullName());
    const industry = body.industry ?? pickIndustry();

    type SandboxEmployeeInsertResult = { id: string };
    const insertResult = await supabase
      .from("sandbox_employees")
      .insert({
        sandbox_id,
        full_name,
        industry,
      })
      .select("id")
      .single();

    if (insertResult.error) {
      console.error("Supabase error:", insertResult.error);
      return NextResponse.json({
        success: false,
        stage: "supabase_insert",
        error: insertResult.error.message,
        details: insertResult.error,
      }, { status: 500 });
    }

    const insertData = insertResult.data as SandboxEmployeeInsertResult | null;
    if (!insertData?.id) {
      return NextResponse.json({
        success: false,
        stage: "supabase_insert",
        error: "Insert did not return id",
      }, { status: 500 });
    }

    const employeeId: string = insertData.id;

    const employmentCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < employmentCount; i++) {
      await linkEmployeeToRandomEmployer({ sandboxId, employeeId });
    }

    const { data: allEmployees } = await supabase.from("sandbox_employees").select("id").eq("sandbox_id", sandboxId);
    const employeePool = (allEmployees ?? []).map((e: { id: string }) => ({ id: e.id }));
    await generatePeerReviews({ sandboxId, employeeId, employeePool });

    await runSandboxIntelligenceRecalculation(sandboxId);
    await calculateSandboxMetrics(sandboxId);

    const data = { id: employeeId, full_name, industry, sandbox_id };
    return NextResponse.json({ success: true, data, employee: data });
  } catch (error) {
    const err = error as { message?: string };
    console.error("EMPLOYEES ROUTE ERROR", error);
    return NextResponse.json({
      success: false,
      stage: "supabase_insert",
      error: err?.message ?? "Unknown",
      details: error,
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sandboxId = req.nextUrl.searchParams.get("sandboxId");
  console.log("QUERY sandboxId:", sandboxId);

  if (!sandboxId) {
    return NextResponse.json({ success: false, error: "Missing sandboxId" }, { status: 400 });
  }

  try {
    await requireSandboxV2Admin();
  } catch (authError) {
    const err = authError as { message?: string };
    console.error("EMPLOYEES GET ROUTE ERROR", authError);
    return NextResponse.json({
      success: false,
      stage: "employees_route",
      error: err?.message ?? "Unknown",
      details: authError,
    }, { status: 500 });
  }

  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("sandbox_employees")
      .select("*")
      .eq("sandbox_id", sandboxId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({
        success: false,
        stage: "supabase_insert",
        error: error.message,
        details: error,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [], employees: data ?? [] });
  } catch (error) {
    const err = error as { message?: string };
    console.error("EMPLOYEES GET ROUTE ERROR", error);
    return NextResponse.json({
      success: false,
      stage: "employees_route",
      error: err?.message ?? "Unknown",
      details: error,
    }, { status: 500 });
  }
}
