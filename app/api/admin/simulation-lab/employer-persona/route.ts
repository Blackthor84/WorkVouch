/**
 * Simulation Lab: create simulated employer persona.
 * Creates auth user (no email), profile, employer_account. Optionally usage_logs.
 * Never triggers Stripe, emails, webhooks, or billing.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin, validateSessionForWrite } from "@/lib/simulation-lab";

export const dynamic = "force-dynamic";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSimulationLabAdmin();
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string;
    const companyName = (body.companyName as string) || "Sim Employer Corp";
    const planTier = (body.planTier as string) || "pro";
    const searchesUsed = Number(body.searchesUsed) || 0;
    const reportsUsed = Number(body.reportsUsed) || 0;

    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = await validateSessionForWrite(sessionId, adminId);
    const expiresAt = session.expires_at;

    const supabase = getSupabaseServer();

    const suffix = randomSuffix();
    const email = `sim-employer-${sessionId.slice(0, 8)}-${suffix}@simulation.local`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: `SimEmp${suffix}!Sec`,
      email_confirm: true,
    });
    if (authError || !authUser?.user?.id) {
      return NextResponse.json({ error: authError?.message ?? "Failed to create auth user" }, { status: 500 });
    }
    const userId = authUser.user.id;

    await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: companyName,
        email,
        is_simulation: true,
        simulation_session_id: sessionId,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "employer" },
      { onConflict: "user_id,role" }
    );

    const { data: eaRow, error: eaErr } = await supabase
      .from("employer_accounts")
      .insert({
        user_id: userId,
        company_name: companyName,
        plan_tier: planTier,
        is_simulation: true,
        simulation_session_id: sessionId,
        expires_at: expiresAt,
        reports_used: reportsUsed,
        searches_used: searchesUsed,
      })
      .select("id")
      .single();
    if (eaErr) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: eaErr.message }, { status: 500 });
    }
    const employerId = eaRow.id;

    if (reportsUsed > 0 || searchesUsed > 0) {
      const cols = ["employer_id", "action_type", "quantity", "is_simulation", "simulation_session_id", "expires_at"];
      const rows: { employer_id: string; action_type: string; quantity: number; is_simulation: boolean; simulation_session_id: string; expires_at: string }[] = [];
      if (searchesUsed > 0) rows.push({ employer_id: employerId, action_type: "search", quantity: searchesUsed, is_simulation: true, simulation_session_id: sessionId, expires_at: expiresAt });
      if (reportsUsed > 0) rows.push({ employer_id: employerId, action_type: "report", quantity: reportsUsed, is_simulation: true, simulation_session_id: sessionId, expires_at: expiresAt });
      if (rows.length) await supabase.from("usage_logs").insert(rows);
    }

    return NextResponse.json({
      ok: true,
      userId,
      employerId,
      companyName,
      planTier,
      email,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
