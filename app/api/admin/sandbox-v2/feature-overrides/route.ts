import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const feature_key = (body.feature_key ?? body.featureKey) as string | undefined;
    const is_enabled = typeof body.is_enabled === "boolean" ? body.is_enabled : body.is_enabled === "true" || body.is_enabled === true;
    if (!sandbox_id || !feature_key) return NextResponse.json({ error: "Missing sandbox_id or feature_key" }, { status: 400 });
    const { error } = await getSupabaseServer().from("sandbox_feature_overrides").upsert({ sandbox_id, feature_key, is_enabled }, { onConflict: "sandbox_id,feature_key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
