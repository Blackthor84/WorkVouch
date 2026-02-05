import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;

const VALID_MODES = ["boardroom", "high_risk", "rapid_growth", "investor_pitch", "ad_explosion"] as const;

/** PUT /api/admin/sandbox-v2/demo-mode — set preset demo mode (alters display, not data) */
export async function PUT(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const demoMode = (body.demo_mode ?? body.demoMode) as string | undefined;

    if (!sandboxId) return NextResponse.json({ error: "Missing sandbox_id" }, { status: 400 });
    if (demoMode !== null && demoMode !== undefined && demoMode !== "" && !VALID_MODES.includes(demoMode as typeof VALID_MODES[number]))
      return NextResponse.json({ error: `Invalid demo_mode. Use one of: ${VALID_MODES.join(", ")}` }, { status: 400 });

    const { data: existing } = await sb()
      .from("sandbox_session_summary")
      .select("id")
      .eq("sandbox_id", sandboxId)
      .maybeSingle();

    const value = demoMode === "" || demoMode === null || demoMode === undefined ? null : demoMode;
    if (existing) {
      const { error } = await sb().from("sandbox_session_summary").update({ demo_mode: value, updated_at: new Date().toISOString() }).eq("sandbox_id", sandboxId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await sb()
        .from("sandbox_session_summary")
        .insert({ sandbox_id: sandboxId, demo_mode: value });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, demo_mode: value });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
