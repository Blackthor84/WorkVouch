/**
 * POST /api/sandbox-signup/employee
 * Sandbox-only: create sandbox_employee for signup flow. No production auth.
 * Validates sandboxId exists in sandbox_sessions.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { linkEmployeeToRandomEmployer } from "@/lib/sandbox/employmentGenerator";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { pickFullName } from "@/lib/sandbox/namePools";
import { INDUSTRIES } from "@/lib/constants/industries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    sandboxId?: string;
    industry?: string;
    full_name?: string;
  };
  const sandboxId = (body.sandboxId ?? "").toString().trim();
  if (!sandboxId) {
    return NextResponse.json({ error: "Missing sandboxId" }, { status: 400 });
  }

  try {
    const supabase = getServiceRoleClient();
    const { data: session } = await supabase
      .from("sandbox_sessions")
      .select("id")
      .eq("id", sandboxId)
      .maybeSingle();
    if (!session?.id) {
      return NextResponse.json({ error: "Invalid or expired sandbox session" }, { status: 400 });
    }

    const full_name = body.full_name?.trim() || pickFullName();
    const rawIndustry = body.industry ?? "";
    const industry =
      typeof rawIndustry === "string" && rawIndustry !== "" && INDUSTRIES.includes(rawIndustry as any)
        ? rawIndustry
        : INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];

    const { data, error } = await supabase
      .from("sandbox_employees")
      .insert({ sandbox_id: sandboxId, full_name, industry })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }
    if (!data?.id) {
      return NextResponse.json({ error: "Insert returned no row" }, { status: 500 });
    }

    const employeeId = String(data.id);
    const employmentCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < employmentCount; i++) {
      await linkEmployeeToRandomEmployer({ sandboxId, employeeId });
    }
    await runSandboxIntelligenceRecalculation(sandboxId);
    await calculateSandboxMetrics(sandboxId);

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[sandbox-signup employee]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
