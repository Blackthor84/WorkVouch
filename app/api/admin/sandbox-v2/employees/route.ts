import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { runSandboxIntelligence } from "@/lib/sandbox/enterpriseEngine";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";

export const dynamic = "force-dynamic";

const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Blake"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore"];
const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function structuredError(stage: string, error: string, details?: unknown) {
  return { success: false, stage, error, ...(details != null && { details }) };
}

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandbox_id ?? body.sandboxId) as string | undefined;

    if (!sandboxId || typeof sandboxId !== "string") {
      return NextResponse.json(structuredError("validation", "Missing sandboxId"), { status: 400 });
    }

    const first = (body.first_name ?? body.firstName)?.trim() || pick(FIRST_NAMES);
    const last = (body.last_name ?? body.lastName)?.trim() || pick(LAST_NAMES);
    const full_name = (body.full_name ?? body.fullName)?.trim() || `${first} ${last}`;
    const industry = (body.industry as string)?.trim() || pick(INDUSTRIES);

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("sandbox_employees")
      .insert({ sandbox_id: sandboxId, full_name, industry })
      .select("id, full_name, industry, created_at")
      .single();

    if (error) {
      console.error("EMPLOYEES POST ERROR", error);
      return NextResponse.json(structuredError("supabase_insert", error.message, { code: error.code, hint: error.hint }), { status: 500 });
    }

    await runSandboxIntelligence(sandboxId);
    await calculateSandboxMetrics(sandboxId);

    return NextResponse.json({ success: true, data: data, employee: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("EMPLOYEES ROUTE ERROR", e);
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
      .from("sandbox_employees")
      .select("id, full_name, industry, created_at")
      .eq("sandbox_id", sandboxId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("EMPLOYEES GET ERROR", error);
      return NextResponse.json(structuredError("supabase_get", error.message, { code: error.code }), { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [], employees: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("EMPLOYEES GET ROUTE ERROR", e);
    if (msg === "Unauthorized") return NextResponse.json(structuredError("auth", msg), { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json(structuredError("auth", msg), { status: 403 });
    return NextResponse.json(structuredError("server", msg), { status: 500 });
  }
}
