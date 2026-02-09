import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { INDUSTRIES_OPTIONS } from "@/lib/constants/industries";

export const dynamic = "force-dynamic";

const COMPANY_NAMES = [
  "Acme Corp", "Beta Industries", "Gamma Labs", "Delta Solutions", "Epsilon Tech",
  "Zenith Partners", "Apex Consulting", "Nova Systems", "Prime Holdings", "Summit Group",
];
const PLAN_TIERS = ["starter", "pro", "custom"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    if (!sandboxId || typeof sandboxId !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid sandboxId" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: session, error: sessionError } = await supabase
      .from("sandbox_sessions")
      .select("id, status")
      .eq("id", sandboxId)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json({ success: false, error: sessionError.message }, { status: 500 });
    }
    if (!session || session.status !== "active") {
      return NextResponse.json({ success: false, error: "Sandbox not found or not active" }, { status: 400 });
    }

    const company_name = pick(COMPANY_NAMES);
    const industry = pick(INDUSTRIES_OPTIONS);
    const plan_tier = pick(PLAN_TIERS);

    const { data, error } = await supabase
      .from("sandbox_employers")
      .insert({ sandbox_id: sandboxId, company_name, industry, plan_tier })
      .select("id, company_name, industry, plan_tier")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    console.log("Sandbox employer generated:", data?.id);
    return NextResponse.json({ success: true, employer: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
