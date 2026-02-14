/**
 * Simulation Lab: session control. Admin/superadmin only.
 * Start, end, extend session. Never affects production users.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  requireSimulationLabAdmin,
  SIMULATION_SESSION_DEFAULT_MINUTES,
  SIMULATION_MAX_EXTEND_MINUTES,
} from "@/lib/simulation-lab";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSimulationLabAdmin();
    const supabase = getSupabaseServer();
    const { data: sessions, error } = await supabase
      .from("simulation_sessions")
      .select("id, created_by_admin_id, created_at, start_at, expires_at, is_active, auto_delete, status")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sessions: sessions ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSimulationLabAdmin();
    const body = await req.json().catch(() => ({}));
    const now = Date.now();
    let startAt: string;
    let expiresAt: string;
    const startAtInput = body.startAt as string | undefined;
    const endAtInput = body.endAt as string | undefined;
    const durationMinutes = Math.min(
      Math.max(Number(body.durationMinutes) || SIMULATION_SESSION_DEFAULT_MINUTES, 5),
      120
    );
    if (startAtInput && endAtInput) {
      startAt = new Date(startAtInput).toISOString();
      expiresAt = new Date(endAtInput).toISOString();
      if (new Date(expiresAt).getTime() <= new Date(startAt).getTime()) {
        return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });
      }
    } else if (startAtInput) {
      startAt = new Date(startAtInput).toISOString();
      const durationMs = durationMinutes * 60 * 1000;
      expiresAt = new Date(new Date(startAt).getTime() + durationMs).toISOString();
    } else {
      startAt = new Date(now).toISOString();
      expiresAt = new Date(now + durationMinutes * 60 * 1000).toISOString();
    }
    const autoDelete = typeof body.autoDelete === "boolean" ? body.autoDelete : true;
    const startTs = new Date(startAt).getTime();
    const status = startTs > now ? "scheduled" : "running";

    const supabase = getSupabaseServer();
    const { data: session, error } = await supabase
      .from("simulation_sessions")
      .insert({
        created_by_admin_id: adminId,
        start_at: startAt,
        expires_at: expiresAt,
        is_active: true,
        auto_delete: autoDelete,
        status,
      })
      .select("id, created_at, start_at, expires_at, is_active, auto_delete, status")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireSimulationLabAdmin();
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId;
    const extendMinutes = Math.min(
      Math.max(Number(body.extendMinutes) || 30, 5),
      SIMULATION_MAX_EXTEND_MINUTES
    );
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const supabase = getSupabaseServer();
    const { data: row } = await supabase
      .from("simulation_sessions")
      .select("expires_at")
      .eq("id", sessionId)
      .single();
    if (!row) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    const current = new Date(row.expires_at).getTime();
    const newExpires = new Date(Math.max(Date.now(), current) + extendMinutes * 60 * 1000).toISOString();
    const { data: session, error } = await supabase
      .from("simulation_sessions")
      .update({ expires_at: newExpires })
      .eq("id", sessionId)
      .select("id, start_at, expires_at, is_active, auto_delete, status")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireSimulationLabAdmin();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("simulation_sessions")
      .update({ is_active: false })
      .eq("id", sessionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
