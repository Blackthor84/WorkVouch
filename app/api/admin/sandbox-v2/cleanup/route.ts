import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

/** Delete expired sandbox_sessions; cascade deletes all sandbox_* data. */
export async function POST() {
  try {
    await requireSandboxV2Admin();
    const { data, error } = await getSupabaseServer()
      .from("sandbox_sessions")
      .delete()
      .lt("ends_at", new Date().toISOString())
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, deleted: (data ?? []).length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
