import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

const TABLE = "sandbox_sessions";

export async function GET() {
  try {
    await requireSandboxV2Admin();
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, name, created_by, starts_at, ends_at, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("SANDBOX SESSIONS GET Supabase error:", error.message, error.code);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, sessions: data ?? [] });
  } catch (err) {
    console.error("SANDBOX SESSIONS ERROR:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const name = (body.name as string) ?? null;
    const now = new Date();
    const starts_at = body.starts_at ? new Date(body.starts_at).toISOString() : now.toISOString();
    const ends_at = body.ends_at ? new Date(body.ends_at).toISOString() : new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ name, created_by: userId, starts_at, ends_at, status: "active" })
      .select("id, name, starts_at, ends_at, status, created_at")
      .single();

    if (error) {
      console.error("Validation/insert failed:", { body, error: error.message, code: error.code });
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.log("Sandbox session created:", data?.id);
    return NextResponse.json({ success: true, session: data });
  } catch (err) {
    console.error("SANDBOX SESSIONS ERROR:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
