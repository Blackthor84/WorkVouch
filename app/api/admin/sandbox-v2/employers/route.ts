import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const company_name = (body.company_name ?? body.companyName) ?? "Sandbox Company";
    const industry = (body.industry as string) ?? null;
    const plan_tier = (body.plan_tier ?? body.planTier) ?? "pro";

    if (!sandbox_id) return NextResponse.json({ error: "Missing sandbox_id" }, { status: 400 });

    const { data, error } = await sb()
      .from("sandbox_employers")
      .insert({ sandbox_id, company_name, industry, plan_tier })
      .select("id, company_name, industry, plan_tier")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, employer: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
