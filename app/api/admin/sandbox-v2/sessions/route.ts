import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

const TABLE = "sandbox_sessions";

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));

    console.log("=== SANDBOX CREATE REQUEST ===");
    console.log("Incoming body:", body);

    const supabase = await createServerSupabase();

    const name = body?.name ?? "Sandbox Session";
    const starts_at = body?.starts_at ?? new Date().toISOString();
    const ends_at =
      body?.ends_at ?? new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const insertPayload = {
      name,
      starts_at,
      ends_at,
      status: "active",
    };

    console.log("Insert payload:", insertPayload);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        {
          success: false,
          stage: "supabase_insert",
          error: error.message,
          details: { code: error.code, hint: error.hint },
        },
        { status: 400 }
      );
    }

    console.log("Sandbox created:", data);

    return NextResponse.json({
      success: true,
      sandbox: data,
      session: data,
    });
  } catch (err: unknown) {
    console.error("Sandbox route crash:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json(
      { success: false, stage: "server_crash", error: msg },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireSandboxV2Admin();
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Sandbox GET error:", error);
      return NextResponse.json(
        { success: false, stage: "supabase_get", error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, sessions: data ?? [], data: data ?? [] });
  } catch (err: unknown) {
    console.error("Sandbox GET crash:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
