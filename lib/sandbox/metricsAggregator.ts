/**
 * Sandbox metrics aggregator. Computes profiles_count, employment_records_count, references_count,
 * mrr, ad_roi and averages from sandbox_* tables; upserts into sandbox_metrics. Data-driven; no mocks.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

const PLAN_VALUE = 99;

export async function calculateSandboxMetrics(sandboxId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceRoleClient();

  const [employeesRes, recordsRes, reviewsRes, intelRes, employersRes, revenueRes, adsRes] = await Promise.all([
    supabase.from("sandbox_employees").select("id").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_employment_records").select("id").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_peer_reviews").select("id").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_intelligence_outputs").select("profile_strength, career_health, risk_index, team_fit, hiring_confidence, network_density").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_employers").select("id, plan_tier").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_revenue").select("mrr").eq("sandbox_id", sandboxId).maybeSingle(),
    supabase.from("sandbox_ads").select("spend, clicks, roi").eq("sandbox_id", sandboxId),
  ]);

  if (employeesRes.error) return { ok: false, error: employeesRes.error.message };
  if (recordsRes.error) return { ok: false, error: recordsRes.error.message };
  if (reviewsRes.error) return { ok: false, error: reviewsRes.error.message };
  if (intelRes.error) return { ok: false, error: intelRes.error.message };
  if (employersRes.error) return { ok: false, error: employersRes.error.message };
  if (revenueRes.error) return { ok: false, error: revenueRes.error.message };
  if (adsRes.error) return { ok: false, error: adsRes.error.message };

  const profiles_count = (employeesRes.data ?? []).length;
  const employment_records_count = (recordsRes.data ?? []).length;
  const references_count = (reviewsRes.data ?? []).length;
  const intel = intelRes.data ?? [];
  const employers = employersRes.data ?? [];
  const ads = adsRes.data ?? [];

  const avg_profile_strength = intel.length > 0
    ? intel.reduce((s, r) => s + Number(r.profile_strength ?? 0), 0) / intel.length
    : null;
  const avg_career_health = intel.length > 0
    ? intel.reduce((s, r) => s + Number(r.career_health ?? 0), 0) / intel.length
    : null;
  const avg_risk_index = intel.length > 0
    ? intel.reduce((s, r) => s + Number(r.risk_index ?? 0), 0) / intel.length
    : null;
  const avg_team_fit = intel.length > 0
    ? intel.reduce((s, r) => s + Number(r.team_fit ?? 0), 0) / intel.length
    : null;
  const avg_hiring_confidence = intel.length > 0
    ? intel.reduce((s, r) => s + Number(r.hiring_confidence ?? 0), 0) / intel.length
    : null;
  const avg_network_density = intel.length > 0
    ? intel.reduce((s, r) => s + Number(r.network_density ?? 0), 0) / intel.length
    : null;

  // MRR: from sandbox_revenue if present, else from sandbox_employers (count * plan value)
  let mrr: number | null = null;
  const revenueRow = revenueRes.data;
  if (revenueRow && (revenueRow as { mrr?: number }).mrr != null) {
    mrr = Number((revenueRow as { mrr: number }).mrr);
  } else if (employers.length > 0) {
    mrr = employers.length * PLAN_VALUE;
  }

  // Ad ROI: weighted by spend if any; else average of per-campaign roi
  let ad_roi: number | null = null;
  const totalSpend = ads.reduce((s, a) => s + Number(a.spend ?? 0), 0);
  const totalClicks = ads.reduce((s, a) => s + Number(a.clicks ?? 0), 0);
  if (totalSpend > 0 && totalClicks > 0) {
    ad_roi = (totalClicks * 150 - totalSpend) / totalSpend;
  } else if (ads.length > 0) {
    const rois = ads.map((a) => Number(a.roi ?? 0)).filter((r) => !Number.isNaN(r));
    ad_roi = rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : null;
  }

  const payload = {
    sandbox_id: sandboxId,
    profiles_count,
    employment_records_count,
    references_count,
    avg_profile_strength,
    avg_career_health,
    avg_risk_index,
    avg_team_fit,
    avg_hiring_confidence,
    avg_network_density,
    mrr,
    ad_roi,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("sandbox_metrics").upsert(payload, { onConflict: "sandbox_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
