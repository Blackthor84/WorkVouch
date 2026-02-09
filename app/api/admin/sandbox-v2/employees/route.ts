import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { linkEmployeeToRandomEmployer } from "@/lib/sandbox/employmentGenerator";
import { generatePeerReviews } from "@/lib/sandbox/peerReviewGenerator";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { pickFullName } from "@/lib/sandbox/namePools";
import { INDUSTRIES } from "@/lib/constants/industries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  console.log("BODY:", body);

  const sandboxIdRaw = body?.sandboxId ?? body?.sandbox_id;
  if (!sandboxIdRaw) {
    return NextResponse.json(
      { success: false, error: "Missing sandboxId" },
      { status: 400 }
    );
  }

  const sandboxId: string = String(sandboxIdRaw);

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
    const rawIndustry = body.industry ?? "";
    const industry =
      typeof rawIndustry === "string" && rawIndustry !== "" && INDUSTRIES.includes(rawIndustry as any)
        ? rawIndustry
        : INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
    if (body.industry != null && body.industry !== "" && !INDUSTRIES.includes(body.industry as any)) {
      return NextResponse.json(
        { error: "Invalid industry" },
        { status: 400 }
      );
    }

    const payload = { sandbox_id, full_name, industry };

    console.log("=== EMPLOYEE INSERT START ===");
    console.log("INSERT sandboxId:", sandboxId);

    const { data, error } = await supabase
      .from("sandbox_employees")
      .insert(payload)
      .select()
      .single();

    console.log("EMPLOYEE ROW CREATED:", data);
    console.log("EMPLOYEE INSERT ERROR:", error);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }

    if (!data?.id) {
      console.error("Employees insert returned no data or id:", data);
      return NextResponse.json({ error: "Insert returned no row or id" }, { status: 500 });
    }

    console.log("Employees insert confirmed sandbox_id:", data.sandbox_id);

    const employeeId = String(data.id);

    const employmentCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < employmentCount; i++) {
      await linkEmployeeToRandomEmployer({
        sandboxId: String(sandboxId),
        employeeId: String(employeeId),
      });
    }

    const { data: allEmployees } = await supabase.from("sandbox_employees").select("id").eq("sandbox_id", sandboxId);
    const employeePool = (allEmployees ?? []).map((e: { id: string }) => ({ id: e.id }));
    await generatePeerReviews({ sandboxId: String(sandboxId), employeeId: String(employeeId), employeePool });

    await runSandboxIntelligenceRecalculation(String(sandboxId));
    await calculateSandboxMetrics(String(sandboxId));

    const employeeResponse = { id: employeeId, full_name, industry, sandbox_id };
    return NextResponse.json({ success: true, data: employeeResponse });
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
      return NextResponse.json({ success: false, error: String(error?.message ?? error) }, { status: 500 });
    }

    const result = Array.isArray(data) ? data : (data ?? []);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const err = error as { message?: string };
    console.error("EMPLOYEES GET ROUTE ERROR", error);
    return NextResponse.json({ success: false, error: String(err?.message ?? error) }, { status: 500 });
  }
}
