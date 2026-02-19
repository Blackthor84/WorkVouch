/**
 * Read-only sandbox observer: trust delta, culture aggregates, signals, abuse risk,
 * and spec shape: reputation_changes, abuse_flags, risk_signals, trust_scores.
 * Queries sandbox_* and abuse_signals (is_sandbox) only.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type ReputationChange = { employee_id: string; delta: number; label?: string };
export type AbuseFlag = { id: string; signal_type: string; severity: number; created_at: string };
export type TrustScore = { employee_id: string; score: number };

export type ObserverResult = {
  trustDelta: number;
  culture: string[];
  signals: string[];
  abuseRisk: number;
  reputation_changes: ReputationChange[];
  abuse_flags: AbuseFlag[];
  risk_signals: string[];
  trust_scores: TrustScore[];
};

export async function getSandboxObserverData(sandboxId?: string): Promise<ObserverResult> {
  const supabase = getServiceRoleClient();
  let resolvedId = sandboxId?.trim();

  if (!resolvedId) {
    const { data: sessions } = await supabase
      .from("sandbox_sessions")
      .select("id")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);
    resolvedId = (sessions?.[0] as { id: string } | undefined)?.id ?? undefined;
  }

  const empty: ObserverResult = {
    trustDelta: 0,
    culture: [],
    signals: [],
    abuseRisk: 0,
    reputation_changes: [],
    abuse_flags: [],
    risk_signals: [],
    trust_scores: [],
  };

  if (!resolvedId) return empty;

  const [intelRes, abuseRes] = await Promise.all([
    supabase
      .from("sandbox_intelligence_outputs")
      .select("employee_id, hiring_confidence, risk_index, team_fit, network_density")
      .eq("sandbox_id", resolvedId),
    supabase
      .from("abuse_signals")
      .select("id, signal_type, severity, created_at")
      .eq("is_sandbox", true)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const rows = (intelRes.data ?? []) as {
    employee_id?: string | null;
    hiring_confidence?: number | null;
    risk_index?: number | null;
    team_fit?: number | null;
    network_density?: number | null;
  }[];

  const abuseRows = (abuseRes.data ?? []) as { id: string; signal_type: string; severity: number; created_at: string }[];

  const n = rows.length;
  const avgConf = n ? rows.reduce((s, r) => s + Number(r.hiring_confidence ?? 0), 0) / n : 0;
  const avgRisk = n ? rows.reduce((s, r) => s + Number(r.risk_index ?? 0), 0) / n : 0;
  const avgTeamFit = n ? rows.reduce((s, r) => s + Number(r.team_fit ?? 0), 0) / n : 0;
  const avgNetwork = n ? rows.reduce((s, r) => s + Number(r.network_density ?? 0), 0) / n : 0;

  const trustDelta = Number((avgConf * 0.01).toFixed(2));
  const culture = avgTeamFit > 0 ? [`TEAM_FIT (${avgTeamFit.toFixed(2)})`] : [];
  const signals = avgNetwork > 0 ? [`NETWORK_DENSITY (${avgNetwork.toFixed(2)})`] : [];
  const abuseRisk = Number(avgRisk.toFixed(2));

  const trust_scores: TrustScore[] = rows
    .filter((r) => r.employee_id != null)
    .map((r) => ({ employee_id: r.employee_id!, score: Number((r.hiring_confidence ?? 0) / 100) }));

  const risk_signals: string[] = rows
    .filter((r) => r.employee_id != null && Number(r.risk_index ?? 0) >= 0.5)
    .map((r) => `HIGH_RISK:${r.employee_id}`);

  const reputation_changes: ReputationChange[] = rows
    .filter((r) => r.employee_id != null)
    .map((r) => ({
      employee_id: r.employee_id!,
      delta: Number(((r.hiring_confidence ?? 0) / 100 - 0.5).toFixed(2)),
      label: (r.hiring_confidence ?? 0) >= 70 ? "positive" : (r.hiring_confidence ?? 0) < 40 ? "negative" : "neutral",
    }));

  const abuse_flags: AbuseFlag[] = abuseRows.map((r) => ({
    id: r.id,
    signal_type: r.signal_type,
    severity: r.severity,
    created_at: r.created_at,
  }));

  return {
    trustDelta,
    culture,
    signals,
    abuseRisk,
    reputation_changes,
    abuse_flags,
    risk_signals,
    trust_scores,
  };
}
