/**
 * POST /api/admin/intelligence-sandbox/cleanup
 * Runs cleanup_expired_intelligence_sandboxes(). Admin only. Production unaffected.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin } from "@/lib/sandbox";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireSandboxAdmin();
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.rpc("cleanup_expired_intelligence_sandboxes");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, result: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
