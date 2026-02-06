import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { pickCompany, pickIndustry } from "@/lib/sandbox/namePools";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    sandboxId?: string;
    sandbox_id?: string;
    company_name?: string;
    industry?: string;
    plan_tier?: string;
  };
  console.log("BODY:", body);

  const sandboxId: string = String(body.sandboxId ?? body.sandbox_id ?? "");
  if (!sandboxId || typeof sandboxId !== "string") {
    return NextResponse.json(
      { success: false, error: "Invalid sandboxId" },
      { status: 400 }
    );
  }

  try {
    await requireSandboxV2Admin();
  } catch (authError) {
    const err = authError as { message?: string };
    console.error("EMPLOYERS ROUTE ERROR", authError);
    return NextResponse.json({
      success: false,
      stage: "employers_route",
      error: err?.message ?? "Unknown",
      details: authError,
    }, { status: 500 });
  }

  try {
    const supabase = getServiceRoleClient();
    const sandbox_id = sandboxId;
    const company_name = body.company_name ?? pickCompany();
    const industry = body.industry ?? pickIndustry();
    const plan_tier = body.plan_tier ?? "pro";

    const { data, error } = await supabase
      .from("sandbox_employers")
      .insert({
        sandbox_id,
        company_name,
        industry,
        plan_tier,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({
        success: false,
        stage: "supabase_insert",
        error: error.message,
        details: error,
      }, { status: 500 });
    }

    await calculateSandboxMetrics(String(sandboxId));

    return NextResponse.json({ success: true, data, employer: data });
  } catch (error) {
    const err = error as { message?: string };
    console.error("EMPLOYERS ROUTE ERROR", error);
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
    console.error("EMPLOYERS GET ROUTE ERROR", authError);
    return NextResponse.json({
      success: false,
      stage: "employers_route",
      error: err?.message ?? "Unknown",
      details: authError,
    }, { status: 500 });
  }

  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("sandbox_employers")
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

    const result = data ?? [];
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const err = error as { message?: string };
    console.error("EMPLOYERS GET ROUTE ERROR", error);
    return NextResponse.json({
      success: false,
      stage: "employers_route",
      error: err?.message ?? "Unknown",
      details: error,
    }, { status: 500 });
  }
}
