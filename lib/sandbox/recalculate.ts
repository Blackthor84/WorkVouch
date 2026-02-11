/**
 * Sandbox intelligence recalculation — uses canonical v1 engine only.
 * Loads sandbox data, builds ProfileInput, calls calculateProfileStrength("v1", input).
 * Optional sandbox-only multiplier: score = clamp(score * multiplier, 0, 100).
 * No duplicate scoring logic. See docs/workvouch-intelligence-v1.md.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import {
  calculateProfileStrength,
  logIntel,
  LOG_TAGS,
  insertScoreHistory,
  insertHealthEvent,
} from "@/lib/core/intelligence";
import { buildSandboxProfileInput } from "./buildProfileInput";
import { calculateSentimentFromText } from "./enterpriseEngine";

function clamp0_100(x: number): number {
  return Math.max(0, Math.min(100, Math.round(x * 10) / 10));
}

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

export async function runSandboxIntelligenceRecalculation(
  sandboxId: string,
  options?: { sentimentMultiplier?: number }
): Promise<{ ok: boolean; error?: string }> {
  const startMs = Date.now();
  logIntel({
    tag: LOG_TAGS.INTEL_START,
    context: "sandbox_recalc",
    sandboxId,
  });

  if (typeof sandboxId !== "string") {
    logIntel({
      tag: LOG_TAGS.INTEL_FAIL,
      context: "sandbox_recalc",
      sandboxId,
      error: "sandboxId must be a string",
      durationMs: Date.now() - startMs,
    });
    return { ok: false, error: "sandboxId must be a string" };
  }
  const supabase = getServiceRoleClient();
  const isSandbox = true;
  const multiplier =
    options?.sentimentMultiplier != null
      ? clamp(options.sentimentMultiplier, 0.5, 2)
      : 1;

  const [employeesRes, reviewsRes, recordsRes] = await Promise.all([
    supabase.from("sandbox_employees").select("id, industry, vertical").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_peer_reviews").select("reviewer_id, reviewed_id, rating, review_text, sentiment_score, reliability_score, teamwork_score, leadership_score, stress_performance_score").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_employment_records").select("employee_id, tenure_months, rehire_eligible").eq("sandbox_id", sandboxId),
  ]);

  if (employeesRes.error) {
    logIntel({
      tag: LOG_TAGS.INTEL_FAIL,
      context: "sandbox_recalc",
      sandboxId,
      error: employeesRes.error.message,
      durationMs: Date.now() - startMs,
    });
    insertHealthEvent({
      event_type: "recalc_fail",
      payload: { sandboxId, error: employeesRes.error.message, context: "sandbox_recalc" },
    }).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
    return { ok: false, error: employeesRes.error.message };
  }
  if (reviewsRes.error) {
    logIntel({
      tag: LOG_TAGS.INTEL_FAIL,
      context: "sandbox_recalc",
      sandboxId,
      error: reviewsRes.error.message,
      durationMs: Date.now() - startMs,
    });
    insertHealthEvent({
      event_type: "recalc_fail",
      payload: { sandboxId, error: reviewsRes.error.message, context: "sandbox_recalc" },
    }).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
    return { ok: false, error: reviewsRes.error.message };
  }
  if (recordsRes.error) {
    logIntel({
      tag: LOG_TAGS.INTEL_FAIL,
      context: "sandbox_recalc",
      sandboxId,
      error: recordsRes.error.message,
      durationMs: Date.now() - startMs,
    });
    insertHealthEvent({
      event_type: "recalc_fail",
      payload: { sandboxId, error: recordsRes.error.message, context: "sandbox_recalc" },
    }).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
    return { ok: false, error: recordsRes.error.message };
  }

  const employees = employeesRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const records = recordsRes.data ?? [];

  const totalEmployees = employees.length;
  const uniqueConnections = new Set(reviews.map((r) => `${r.reviewer_id}-${r.reviewed_id}`)).size;
  const networkDensityBase = totalEmployees > 0 ? uniqueConnections / totalEmployees : 0;
  const networkDensityScore = clamp0_100(networkDensityBase * 100);

  const reviewsByReviewed = new Map<string, typeof reviews>();
  for (const r of reviews) {
    const id = r.reviewed_id ?? "";
    if (!id) continue;
    if (!reviewsByReviewed.has(id)) reviewsByReviewed.set(id, []);
    reviewsByReviewed.get(id)!.push(r);
  }

  const recordsByEmployee = new Map<string, typeof records>();
  for (const r of records) {
    if (!recordsByEmployee.has(r.employee_id)) recordsByEmployee.set(r.employee_id, []);
    recordsByEmployee.get(r.employee_id)!.push(r);
  }

  const { data: existingOutputs } = await supabase
    .from("sandbox_intelligence_outputs")
    .select("employee_id, profile_strength")
    .eq("sandbox_id", sandboxId);
  const previousByEmployee = new Map<string, number>();
  for (const row of existingOutputs ?? []) {
    const id = (row as { employee_id?: string }).employee_id;
    const s = (row as { profile_strength?: number | null }).profile_strength;
    if (id != null && s != null) previousByEmployee.set(id, Number(s));
  }

  for (const emp of employees) {
    const empId = emp.id;
    const empReviews = reviewsByReviewed.get(empId) ?? [];
    const empRecords = recordsByEmployee.get(empId) ?? [];
    const previousScore = previousByEmployee.get(empId) ?? null;

    const input = buildSandboxProfileInput(empReviews, empRecords, calculateSentimentFromText);
    const vertical = (emp as { vertical?: string | null }).vertical ?? "default";
    let profile_strength = calculateProfileStrength("v1", input, { vertical });
    if (isSandbox && multiplier !== 1) {
      profile_strength = Math.round(clamp(profile_strength * multiplier, 0, 100));
    }

    const network_density = networkDensityScore;
    const career_health = profile_strength;
    const risk_index = 100 - profile_strength;
    const team_fit = profile_strength;
    const hiring_confidence = profile_strength;

    const payload = {
      sandbox_id: sandboxId,
      employee_id: empId,
      profile_strength,
      career_health,
      risk_index,
      team_fit,
      hiring_confidence,
      network_density,
    };
    const { error } = await supabase
      .from("sandbox_intelligence_outputs")
      .upsert(payload, { onConflict: "sandbox_id,employee_id" });
    if (error) {
      logIntel({
        tag: LOG_TAGS.INTEL_FAIL,
        context: "sandbox_recalc_write",
        sandboxId,
        error: error.message,
        durationMs: Date.now() - startMs,
      });
      insertHealthEvent({
        event_type: "recalc_fail",
        payload: { sandboxId, error: error.message, context: "sandbox_recalc_write" },
      }).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
      return { ok: false, error: error.message };
    }

    await insertScoreHistory({
      entity_type: "sandbox",
      sandbox_id: sandboxId,
      employee_id: empId,
      previous_score: previousScore,
      new_score: profile_strength,
      reason: "sandbox_recalculation",
      triggered_by: null,
    }).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
  }

  logIntel({
    tag: LOG_TAGS.INTEL_SUCCESS,
    context: "sandbox_recalc",
    sandboxId,
    durationMs: Date.now() - startMs,
  });
  insertHealthEvent({
    event_type: "recalc_success",
    payload: { sandboxId, employeeCount: employees.length },
  }).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
  return { ok: true };
}
