import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin, requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { seedSandboxFeatures } from "@/lib/sandbox/seedFeatures";

export const dynamic = "force-dynamic";

const TABLE = "sandbox_sessions";

function structuredError(success: false, error: string, details?: unknown) {
  return { success, error, ...(details != null && { details }) };
}

export async function POST(req: Request) {
  try {
    const { id: userId } = await requireSandboxV2Admin();
    if (!userId) {
      console.error("Sessions POST failure:", { stage: "auth", error: "No user id" });
      return NextResponse.json(structuredError(false, "Not authenticated"), { status: 401 });
    }

    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));

    console.log("=== SANDBOX CREATE REQUEST ===");
    console.log("Incoming body:", body);

    const name = body?.name ?? "Sandbox Session";
    const starts_at = body?.starts_at ?? new Date().toISOString();
    const ends_at =
      body?.ends_at ?? new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const insertPayload = {
      name,
      status: "active",
      starts_at,
      ends_at,
      created_by: userId,
    };

    console.log("Insert payload:", insertPayload);

    const { data, error } = await supabase
      .from(TABLE)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({
        success: false,
        stage: "insert",
        error: error?.message,
        details: error,
      }, { status: 500 });
    }

    console.log("Sandbox created:", data?.id);

    const seedResult = await seedSandboxFeatures(data.id);
    if (!seedResult.ok) {
      console.error("Session seed features failed:", seedResult.error);
    }

    return NextResponse.json({ success: true, data: data ?? {} });
  } catch (err: unknown) {
    console.error("Sessions POST failure:", { stage: "server_crash", err });
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "Unauthorized") return NextResponse.json(structuredError(false, msg), { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json(structuredError(false, msg), { status: 403 });
    return NextResponse.json(structuredError(false, msg), { status: 500 });
  }
}

export async function GET() {
  try {
    const { id: userId, isSuperAdmin } = await requireSandboxV2AdminWithRole();
    if (!userId) {
      console.error("Sessions GET failure:", { stage: "auth", error: "No user id" });
      return Response.json({ sessions: [], sandbox: true }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    let query = supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!isSuperAdmin) {
      query = query.eq("created_by", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Sandbox sessions error:", error);
      return Response.json({ sessions: [], sandbox: true }, { status: 500 });
    }

    const sessions = Array.isArray(data) ? data : (data != null ? [data] : []);
    return Response.json({ sessions, sandbox: true });
  } catch (err: unknown) {
    console.error("Sandbox sessions error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") return Response.json({ sessions: [], sandbox: true }, { status: 401 });
    if (msg.startsWith("Forbidden")) return Response.json({ sessions: [], sandbox: true }, { status: 403 });
    return Response.json({ sessions: [], sandbox: true }, { status: 500 });
  }
}
