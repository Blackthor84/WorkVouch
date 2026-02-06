import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSandboxV2Admin();
    const { data, error } = await getSupabaseServer()
      .from("sandbox_sessions")
      .select("id, name, created_by, starts_at, ends_at, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sessions: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const name = (body.name as string) ?? null;
    const now = new Date();
    const starts_at = body.starts_at ? new Date(body.starts_at).toISOString() : now.toISOString();
    const ends_at = body.ends_at ? new Date(body.ends_at).toISOString() : new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const { data, error } = await getSupabaseServer()
      .from("sandbox_sessions")
      .insert({ name, created_by: userId, starts_at, ends_at, status: "active" })
      .select("id, name, starts_at, ends_at, status")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ session: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
