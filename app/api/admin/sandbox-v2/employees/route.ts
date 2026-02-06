import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

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

  let user: { id: string };
  try {
    user = await requireSandboxV2Admin();
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
    const payload = {
      sandbox_id: sandboxId,
      first_name: body.first_name ?? "John",
      last_name: body.last_name ?? "Doe",
      job_title: body.job_title ?? "Security Officer",
      industry: body.industry ?? "Security",
      tenure_months: body.tenure_months ?? 24,
      risk_score: 40,
      profile_strength: 72,
      career_health: 70,
      network_density: 0.65,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("sandbox_employees")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("EMPLOYEES POST ERROR", error);
      return NextResponse.json({
        success: false,
        stage: "supabase_insert",
        error: (error as { message?: string })?.message ?? "Unknown",
        details: error,
      }, { status: 500 });
    }

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
      console.error("EMPLOYEES GET ERROR", error);
      return NextResponse.json({
        success: false,
        stage: "supabase_get",
        error: (error as { message?: string })?.message ?? "Unknown",
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
