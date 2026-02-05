import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const sandboxId = req.nextUrl.searchParams.get("sandboxId")?.trim() ?? null;
    const { data: registry, error } = await sb().from("sandbox_feature_registry").select("id, feature_key, is_enabled").order("feature_key");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    let overrides: { feature_key: string; is_enabled: boolean }[] = [];
    if (sandboxId) {
      const { data: ov } = await sb().from("sandbox_feature_overrides").select("feature_key, is_enabled").eq("sandbox_id", sandboxId);
      overrides = ov ?? [];
    }
    return NextResponse.json({
      features: registry ?? [],
      overrides: overrides.reduce((acc, o) => ({ ...acc, [o.feature_key]: o.is_enabled }), {} as Record<string, boolean>),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
