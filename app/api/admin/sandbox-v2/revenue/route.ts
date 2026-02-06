import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const PLAN_VALUE = 99;

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const sandboxId = req.nextUrl.searchParams.get("sandboxId")?.trim() ?? null;
    if (!sandboxId) return NextResponse.json({ error: "Missing sandboxId" }, { status: 400 });
    const { data: rows } = await getSupabaseServer().from("sandbox_revenue").select("mrr, churn_rate").eq("sandbox_id", sandboxId).order("created_at", { ascending: false }).limit(1);
    const rev = Array.isArray(rows) && rows[0] ? rows[0] : null;
    return NextResponse.json({ mrr: rev?.mrr ?? 0, churn_rate: rev?.churn_rate ?? 0 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const churn_rate = typeof body.churn_rate === "number" ? body.churn_rate : typeof body.churn_rate === "string" ? parseFloat(body.churn_rate) : 0;
    if (!sandbox_id) return NextResponse.json({ error: "Missing sandbox_id" }, { status: 400 });
    const { count } = await getSupabaseServer().from("sandbox_employers").select("id", { count: "exact", head: true }).eq("sandbox_id", sandbox_id);
    const employer_count = count ?? 0;
    const mrr = employer_count * PLAN_VALUE;
    const { error } = await getSupabaseServer().from("sandbox_revenue").insert({ sandbox_id, mrr, churn_rate });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, mrr, churn_rate, employer_count });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
