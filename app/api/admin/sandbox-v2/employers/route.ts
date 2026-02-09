import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { pickCompany } from "@/lib/sandbox/namePools";
import { INDUSTRIES } from "@/lib/constants/industries";

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
  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

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
    const plan_tier = body.plan_tier ?? "pro";

    console.log("=== EMPLOYER INSERT START ===");
    console.log("INSERT sandboxId:", sandboxId);

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

    console.log("EMPLOYER ROW CREATED:", data);
    console.log("EMPLOYER INSERT ERROR:", error);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }

    if (!data) {
      console.error("Employers insert returned no data");
      return NextResponse.json({ error: "Insert returned no row" }, { status: 500 });
    }

    console.log("Employers insert confirmed sandbox_id:", data.sandbox_id);

    await calculateSandboxMetrics(String(sandboxId));

    return NextResponse.json({ success: true, data: data ?? {} });
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
      return NextResponse.json({ success: false, error: String(error?.message ?? error) }, { status: 500 });
    }

    const result = Array.isArray(data) ? data : (data ?? []);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const err = error as { message?: string };
    console.error("EMPLOYERS GET ROUTE ERROR", error);
    return NextResponse.json({ success: false, error: String(err?.message ?? error) }, { status: 500 });
  }
}
