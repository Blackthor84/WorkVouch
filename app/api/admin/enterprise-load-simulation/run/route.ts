/**
 * Enterprise load simulation: create Casino test org, 10 admins, 5 locations,
 * 1000 candidate profiles, peer reviews, and run calculateUserIntelligence.
 * Only when ENTERPRISE_SIMULATION_MODE=true. Admin only. No production impact.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";
import { requireEnterpriseSimulationMode } from "@/lib/enterprise/simulation-guard";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 100;
const CANDIDATE_COUNT = 1000;
const ADMINS_COUNT = 10;
const LOCATIONS_COUNT = 5;
const COMPANY_NAME = "Casino Security Inc";
const INDUSTRY = "security";

const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Casey", "Morgan", "Riley", "Quinn", "Avery", "Reese", "Dakota"];
const LAST_NAMES = ["Smith", "Jones", "Williams", "Brown", "Garcia", "Martinez", "Lee", "Wilson", "Taylor", "Clark"];
const STATES = ["CA", "NV", "NJ", "NY", "TX", "FL", "IL", "PA", "OH", "AZ"];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: NextRequest) {
  const startRun = Date.now();
  const metrics = {
    candidates_created: 0,
    reviews_created: 0,
    avg_score_time_ms: 0,
    max_score_time_ms: 0,
    score_failures: 0,
    batch_insert_ms: [] as number[],
  };

  try {
    requireEnterpriseSimulationMode();
    const { id: adminId } = await requireSimulationLabAdmin();

    const supabase = getSupabaseServer() as any;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: sessionRow, error: sessionErr } = await supabase
      .from("simulation_sessions")
      .insert({
        created_by_admin_id: adminId,
        expires_at: expiresAt,
        start_at: new Date().toISOString(),
        is_active: true,
        auto_delete: true,
        status: "running",
      })
      .select("id")
      .single();
    if (sessionErr || !sessionRow?.id) {
      return NextResponse.json({ error: "Failed to create simulation session", detail: sessionErr?.message }, { status: 500 });
    }
    const sessionId = sessionRow.id;
    const simulationContext = { simulationSessionId: sessionId, expiresAt };

    const slug = `enterprise-casino-sim-${sessionId.slice(0, 8)}`;
    const { data: orgRow, error: orgErr } = await supabase
      .from("organizations")
      .insert({
        name: "Enterprise Casino Group (Simulation)",
        slug,
        billing_tier: "enterprise",
        plan_type: "enterprise",
        number_of_locations: LOCATIONS_COUNT,
        estimated_monthly_hires: 1000,
        is_simulation: true,
        simulation_session_id: sessionId,
      })
      .select("id")
      .single();
    if (orgErr || !orgRow?.id) {
      return NextResponse.json({ error: "Failed to create simulation org", detail: orgErr?.message }, { status: 500 });
    }
    const orgId = orgRow.id;

    const adminProfileIds: string[] = [];
    for (let i = 0; i < ADMINS_COUNT; i++) {
      const email = `casino-admin-${i}-${sessionId.slice(0, 8)}@simulation.local`;
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password: `Sim${i}Casino!Sec`,
        email_confirm: true,
      });
      if (authErr || !authUser?.user?.id) continue;
      const uid = authUser.user.id;
      await supabase.from("profiles").upsert({
        id: uid,
        full_name: `Casino Admin ${i + 1}`,
        email,
        is_simulation: true,
        simulation_session_id: sessionId,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      await supabase.from("user_roles").upsert({ user_id: uid, role: "user" }, { onConflict: "user_id,role" });
      if (i === 0) await supabase.from("user_roles").upsert({ user_id: uid, role: "employer" }, { onConflict: "user_id,role" });
      await supabase.from("employer_users").insert({
        organization_id: orgId,
        profile_id: uid,
        role: "org_admin",
      });
      adminProfileIds.push(uid);
    }

    const locationIds: string[] = [];
    for (let i = 0; i < LOCATIONS_COUNT; i++) {
      const { data: loc, error: locErr } = await supabase
        .from("locations")
        .insert({
          organization_id: orgId,
          name: `Casino Location ${i + 1}`,
          slug: `location-${i + 1}`,
        })
        .select("id")
        .single();
      if (!locErr && loc?.id) locationIds.push(loc.id);
    }

    const firstEmployerId = adminProfileIds[0];
    const { data: empAcc } = await supabase
      .from("employer_accounts")
      .insert({
        user_id: firstEmployerId,
        organization_id: orgId,
        company_name: "Enterprise Casino Group (Simulation)",
        plan_tier: "professional",
        subscription_status: "active",
        is_simulation: true,
        simulation_session_id: sessionId,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    const candidateIds: string[] = [];
    const employmentRecordIdsByUserId: Record<string, string> = {};
    const companyNorm = COMPANY_NAME.toLowerCase().trim();

    for (let batchStart = 0; batchStart < CANDIDATE_COUNT; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, CANDIDATE_COUNT);
      const t0 = Date.now();
      for (let i = batchStart; i < batchEnd; i++) {
        const email = `casino-cand-${i}-${sessionId.slice(0, 8)}@simulation.local`;
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
          email,
          password: `Cand${i}!Sec`,
          email_confirm: true,
        });
        if (authErr || !authUser?.user?.id) continue;
        const userId = authUser.user.id;
        const fullName = `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)} ${i}`;
        await supabase.from("profiles").upsert({
          id: userId,
          full_name: fullName,
          email,
          industry: INDUSTRY,
          state: randomPick(STATES),
          is_simulation: true,
          simulation_session_id: sessionId,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
        await supabase.from("user_roles").upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

        const startDate = new Date(Date.now() - randomInt(12, 60) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const endDate = Math.random() > 0.3 ? new Date(Date.now() - randomInt(0, 24) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : null;
        const { data: erRow, error: erErr } = await supabase
          .from("employment_records")
          .insert({
            user_id: userId,
            company_name: COMPANY_NAME,
            company_normalized: companyNorm,
            job_title: "Security Associate",
            start_date: startDate,
            end_date: endDate,
            is_current: !endDate,
            verification_status: "verified",
            is_simulation: true,
            simulation_session_id: sessionId,
            expires_at: expiresAt,
          })
          .select("id")
          .single();
        if (erErr || !erRow?.id) continue;
        candidateIds.push(userId);
        employmentRecordIdsByUserId[userId] = erRow.id;
      }
      metrics.batch_insert_ms.push(Date.now() - t0);
      metrics.candidates_created = candidateIds.length;
    }

    let totalScoreMs = 0;
    let scoreCount = 0;
    for (let i = 0; i < candidateIds.length; i++) {
      const candidateId = candidateIds[i];
      const recordId = employmentRecordIdsByUserId[candidateId];
      if (!recordId) continue;
      const numMatches = randomInt(2, 4);
      const others = candidateIds.filter((id) => id !== candidateId);
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      const peers = shuffled.slice(0, numMatches);
      for (const peerId of peers) {
        const overlapStart = new Date().toISOString().slice(0, 10);
        const overlapEnd = new Date().toISOString().slice(0, 10);
        const { data: matchRow, error: matchErr } = await supabase
          .from("employment_matches")
          .insert({
            employment_record_id: recordId,
            matched_user_id: peerId,
            overlap_start: overlapStart,
            overlap_end: overlapEnd,
            match_status: "confirmed",
            is_simulation: true,
            simulation_session_id: sessionId,
            expires_at: expiresAt,
          })
          .select("id")
          .single();
        if (matchErr || !matchRow?.id) continue;
        const { error: refErr } = await supabase.from("employment_references").insert({
          employment_match_id: matchRow.id,
          reviewer_id: peerId,
          reviewed_user_id: candidateId,
          rating: randomInt(1, 5),
          comment: "Simulated review.",
          is_simulation: true,
          simulation_session_id: sessionId,
          expires_at: expiresAt,
        });
        if (!refErr) metrics.reviews_created++;
      }

      const t0 = Date.now();
      try {
        await calculateUserIntelligence(candidateId, simulationContext);
        const elapsed = Date.now() - t0;
        totalScoreMs += elapsed;
        scoreCount++;
        if (elapsed > metrics.max_score_time_ms) metrics.max_score_time_ms = elapsed;
      } catch {
        metrics.score_failures++;
      }
    }

    if (scoreCount > 0) metrics.avg_score_time_ms = Math.round(totalScoreMs / scoreCount);

    return NextResponse.json({
      ok: true,
      simulation_summary: {
        session_id: sessionId,
        org_id: orgId,
        candidates_created: metrics.candidates_created,
        reviews_created: metrics.reviews_created,
        admins_created: adminProfileIds.length,
        locations_created: locationIds.length,
        employer_account_id: empAcc?.id ?? null,
        employer_user_id_for_unlock: firstEmployerId,
      },
      performance_metrics: {
        avg_score_time_ms: metrics.avg_score_time_ms,
        max_score_time_ms: metrics.max_score_time_ms,
        score_failures: metrics.score_failures,
        batch_insert_ms: metrics.batch_insert_ms,
        total_run_ms: Date.now() - startRun,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ENTERPRISE_SIMULATION_MODE") || msg.includes("disabled"))
      return NextResponse.json({ error: msg }, { status: 403 });
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
