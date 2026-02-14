/**
 * Simulation Lab: load testing engine.
 * Creates N simulated employee personas in one session. Real scoring pipeline.
 * Admin only. Never triggers Stripe, emails, webhooks. Hard simulation isolation.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin, validateSessionForWrite } from "@/lib/simulation-lab";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";
import { runCandidateIntelligence } from "@/lib/intelligence/runIntelligencePipeline";
import { persistUnifiedIntelligence } from "@/lib/intelligence/unified-intelligence";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_BATCH = 50;

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSimulationLabAdmin();
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string;
    const count = Math.min(MAX_BATCH, Math.max(1, Number(body.count) || 5));
    const companyName = (body.companyName as string) || "Load Test Corp";

    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = await validateSessionForWrite(sessionId, adminId);
    const expiresAt = session.expires_at;
    const simulationContext = { simulationSessionId: sessionId, expiresAt };

    const supabase = getSupabaseServer();

    const companyNormalized = companyName.toLowerCase().trim();
    const createdIds: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < count; i++) {
      const suffix = randomSuffix();
      const email = `load-${sessionId.slice(0, 8)}-${i}-${suffix}@simulation.local`;
      const fullName = `Load Employee ${i + 1}`;
      const startDate = new Date(Date.now() - (i + 1) * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: `Load${suffix}!Sec`,
        email_confirm: true,
      });
      if (authError || !authUser?.user?.id) {
        errors.push(`Persona ${i + 1}: ${authError?.message ?? "auth failed"}`);
        continue;
      }
      const userId = authUser.user.id;

      await supabase.from("profiles").upsert(
        {
          id: userId,
          full_name: fullName,
          email,
          is_simulation: true,
          simulation_session_id: sessionId,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      await supabase.from("user_roles").upsert(
        { user_id: userId, role: "user" },
        { onConflict: "user_id,role" }
      );

      const { error: erErr } = await supabase.from("employment_records").insert({
        user_id: userId,
        company_name: companyName,
        company_normalized: companyNormalized,
        job_title: "Associate",
        start_date: startDate,
        end_date: null,
        is_current: true,
        verification_status: "verified",
        is_simulation: true,
        simulation_session_id: sessionId,
        expires_at: expiresAt,
      });
      if (erErr) {
        await supabase.auth.admin.deleteUser(userId);
        errors.push(`Persona ${i + 1}: ${erErr.message}`);
        continue;
      }

      await calculateUserIntelligence(userId, simulationContext);
      await runCandidateIntelligence(userId, simulationContext);
      await persistUnifiedIntelligence(userId, simulationContext);

      createdIds.push(userId);
    }

    return NextResponse.json({
      ok: true,
      requested: count,
      created: createdIds.length,
      userIds: createdIds,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
