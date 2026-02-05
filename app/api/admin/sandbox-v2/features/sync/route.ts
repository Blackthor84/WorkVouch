import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;

export async function POST() {
  try {
    await requireSandboxV2Admin();
    const { data: flags, error: listErr } = await sb().from("feature_flags").select("key");
    if (listErr || !flags?.length) return NextResponse.json({ synced: 0 });
    const keys = flags.map((f: { key: string }) => f.key).filter(Boolean);
    let synced = 0;
    for (const feature_key of keys) {
      const { error } = await sb().from("sandbox_feature_registry").upsert({ feature_key, is_enabled: true }, { onConflict: "feature_key" });
      if (!error) synced++;
    }
    return NextResponse.json({ success: true, synced });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
