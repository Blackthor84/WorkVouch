import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;
const ASSUMED_CONVERSION_VALUE = 150;

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const employer_id = (body.employer_id ?? body.employerId) as string | undefined;
    const impressions = typeof body.impressions === "number" ? body.impressions : typeof body.impressions === "string" ? parseInt(body.impressions, 10) : 0;
    const clicks = typeof body.clicks === "number" ? body.clicks : typeof body.clicks === "string" ? parseInt(body.clicks, 10) : 0;
    const spend = typeof body.spend === "number" ? body.spend : typeof body.spend === "string" ? parseFloat(body.spend) : 0;
    const roi = spend > 0 ? (clicks * ASSUMED_CONVERSION_VALUE - spend) / spend : 0;

    if (!sandbox_id) return NextResponse.json({ error: "Missing sandbox_id" }, { status: 400 });

    const { data, error } = await sb()
      .from("sandbox_ads")
      .insert({ sandbox_id, employer_id: employer_id ?? null, impressions, clicks, spend, roi })
      .select("id, impressions, clicks, spend, roi")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, ad: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
