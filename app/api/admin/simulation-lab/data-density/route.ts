/**
 * Simulation Lab: data density tracker.
 * Records or returns density snapshots (profiles, employment_records, references, intelligence).
 * Admin only. Supports global, session, or employer scope.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";
import type { DataDensitySnapshotInsert } from "@/types/simulation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSimulationLabAdmin();
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") ?? "global";
    const scopeId = searchParams.get("scopeId") ?? null;
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));

    let query = supabase
      .from("data_density_snapshots")
      .select("id, snapshot_at, scope, scope_id, profiles_count, employment_records_count, references_count, intelligence_rows_count, is_simulation, created_at")
      .order("snapshot_at", { ascending: false })
      .limit(limit);
    if (scope !== "global") query = query.eq("scope", scope);
    if (scopeId) query = query.eq("scope_id", scopeId);

    const { data: rows, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ snapshots: rows ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSimulationLabAdmin();
    const supabase = getSupabaseServer();
    const body = await req.json().catch(() => ({}));
    const scope = (body.scope as string) ?? "global";
    const scopeId = (body.scopeId as string) ?? null;
    const sessionId = (body.simulationSessionId as string) ?? null;
    const isSimulation = Boolean(body.isSimulation ?? sessionId);

    const now = new Date().toISOString();

    if (scope === "global") {
      const [p, e, r, i] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_simulation", false),
        supabase.from("employment_records").select("id", { count: "exact", head: true }).eq("is_simulation", false),
        supabase.from("employment_references").select("id", { count: "exact", head: true }).eq("is_simulation", false),
        supabase.from("intelligence_snapshots").select("id", { count: "exact", head: true }).eq("is_simulation", false),
      ]);
      const insertRow: DataDensitySnapshotInsert = {
        snapshot_at: now,
        scope: "global",
        scope_id: null,
        profiles_count: p.count ?? 0,
        employment_records_count: e.count ?? 0,
        references_count: r.count ?? 0,
        intelligence_rows_count: i.count ?? 0,
        is_simulation: false,
        simulation_session_id: null,
      };
      const { data: inserted, error: insErr } = await supabase.from("data_density_snapshots").insert(insertRow).select("id, snapshot_at, profiles_count, employment_records_count, references_count, intelligence_rows_count").single();
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
      return NextResponse.json({ snapshot: inserted });
    }

    if (scope === "session" && scopeId) {
      const [p, e, r, i] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("simulation_session_id", scopeId),
        supabase.from("employment_records").select("id", { count: "exact", head: true }).eq("simulation_session_id", scopeId),
        supabase.from("employment_references").select("id", { count: "exact", head: true }).eq("simulation_session_id", scopeId),
        supabase.from("intelligence_snapshots").select("id", { count: "exact", head: true }).eq("simulation_session_id", scopeId),
      ]);
      const insertRowSession: DataDensitySnapshotInsert = {
        snapshot_at: now,
        scope: "session",
        scope_id: scopeId,
        profiles_count: p.count ?? 0,
        employment_records_count: e.count ?? 0,
        references_count: r.count ?? 0,
        intelligence_rows_count: i.count ?? 0,
        is_simulation: true,
        simulation_session_id: scopeId,
      };
      const { data: insertedSession, error: insErrSession } = await supabase.from("data_density_snapshots").insert(insertRowSession).select("id, snapshot_at, profiles_count, employment_records_count, references_count, intelligence_rows_count").single();
      if (insErrSession) return NextResponse.json({ error: insErrSession.message }, { status: 500 });
      return NextResponse.json({ snapshot: insertedSession });
    }

    return NextResponse.json({ error: "scope must be global or session with scopeId" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
