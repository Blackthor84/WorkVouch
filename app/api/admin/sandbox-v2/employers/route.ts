import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { runSandboxIntelligence } from "@/lib/sandbox/enterpriseEngine";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";

export const dynamic = "force-dynamic";

const COMPANY_NAMES = [
  "Acme Corp", "Beta Industries", "Gamma Labs", "Delta Solutions", "Epsilon Tech",
  "Zenith Partners", "Apex Consulting", "Nova Systems", "Prime Holdings", "Summit Group",
];
const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Energy", "Media"];
const PLAN_TIERS = ["starter", "pro", "custom"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function structuredError(stage: string, error: string, details?: unknown) {
  return { success: false, stage, error, ...(details != null && { details }) };
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandbox_id ?? body.sandboxId) as string | undefined;

    if (!sandboxId || typeof sandboxId !== "string") {
      return NextResponse.json(structuredError("validation", "Missing sandboxId"), { status: 400 });
    }

    const company_name = (body.company_name ?? body.companyName)?.trim() || pick(COMPANY_NAMES);
    const industry = (body.industry as string)?.trim() || pick(INDUSTRIES);
    const plan_tier = (body.plan_tier ?? body.planTier) ?? pick(PLAN_TIERS);

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("sandbox_employers")
      .insert({ sandbox_id: sandboxId, company_name, industry, plan_tier })
      .select("id, company_name, industry, plan_tier, created_at")
      .single();

    if (error) {
      console.error("EMPLOYERS POST ERROR", error);
      return NextResponse.json(structuredError("supabase_insert", error.message, { code: error.code, hint: error.hint }), { status: 500 });
    }

    await runSandboxIntelligence(sandboxId);
    await calculateSandboxMetrics(sandboxId);

    return NextResponse.json({ success: true, data: data, employer: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("EMPLOYERS ROUTE ERROR", e);
    if (msg === "Unauthorized") return NextResponse.json(structuredError("auth", msg), { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json(structuredError("auth", msg), { status: 403 });
    return NextResponse.json(structuredError("server", msg), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const sandboxId = req.nextUrl.searchParams.get("sandboxId")?.trim() ?? null;

    if (!sandboxId) {
      return NextResponse.json(structuredError("validation", "Missing sandboxId"), { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("sandbox_employers")
      .select("id, company_name, industry, plan_tier, created_at")
      .eq("sandbox_id", sandboxId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("EMPLOYERS GET ERROR", error);
      return NextResponse.json(structuredError("supabase_get", error.message, { code: error.code }), { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [], employers: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("EMPLOYERS GET ROUTE ERROR", e);
    if (msg === "Unauthorized") return NextResponse.json(structuredError("auth", msg), { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json(structuredError("auth", msg), { status: 403 });
    return NextResponse.json(structuredError("server", msg), { status: 500 });
  }
}
