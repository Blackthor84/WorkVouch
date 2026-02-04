/**
 * Simulation Lab: list simulated employees and employers for a session.
 * Admin only. Used for peer review dropdowns and lab display.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { id: adminId } = await requireSimulationLabAdmin();
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const supabase = getSupabaseServer();
    const { data: session } = await supabase
      .from("simulation_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("created_by_admin_id", adminId)
      .single();
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const [profilesRes, employersRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").eq("simulation_session_id", sessionId).eq("is_simulation", true),
      supabase.from("employer_accounts").select("id, company_name, plan_tier").eq("simulation_session_id", sessionId).eq("is_simulation", true),
    ]);
    const employees = (profilesRes.data ?? []) as { id: string; full_name?: string; email?: string }[];
    const employers = (employersRes.data ?? []) as { id: string; company_name?: string; plan_tier?: string }[];

    return NextResponse.json({ employees, employers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
