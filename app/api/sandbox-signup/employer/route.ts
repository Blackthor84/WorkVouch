/**
 * POST /api/sandbox-signup/employer
 * Sandbox-only: create sandbox_employer for signup flow. No production auth.
 * Validates sandboxId exists in sandbox_sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { pickCompany } from "@/lib/sandbox/namePools";
import { INDUSTRIES } from "@/lib/constants/industries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    sandboxId?: string;
    industry?: string;
    plan_tier?: string;
    company_name?: string;
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

    const company_name = body.company_name?.trim() || pickCompany();
    const rawIndustry = body.industry ?? "";
    const industry =
      typeof rawIndustry === "string" && rawIndustry !== "" && INDUSTRIES.includes(rawIndustry as any)
        ? rawIndustry
        : INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
    const plan_tier = body.plan_tier ?? "pro";

    const { data, error } = await supabase
      .from("sandbox_employers")
      .insert({ sandbox_id: sandboxId, company_name, industry, plan_tier })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Insert returned no row" }, { status: 500 });
    }

    await calculateSandboxMetrics(sandboxId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[sandbox-signup employer]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
