/**
 * Read-only sandbox observer: trust delta, culture aggregates, signals, abuse risk.
 * Queries sandbox_* tables only. No labels, no permanent scores.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type ObserverResult = {
  trustDelta: number;
  culture: string[];
  signals: string[];
  abuseRisk: number;
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

  if (!resolvedId) {
    return { trustDelta: 0, culture: [], signals: [], abuseRisk: 0 };
  }

  const { data: intel } = await supabase
    .from("sandbox_intelligence_outputs")
    .select("hiring_confidence, risk_index, team_fit, network_density")
    .eq("sandbox_id", resolvedId);

  const rows = (intel ?? []) as {
    hiring_confidence?: number | null;
    risk_index?: number | null;
    team_fit?: number | null;
    network_density?: number | null;
  }[];

  const n = rows.length;
  const avgConf = n ? rows.reduce((s, r) => s + Number(r.hiring_confidence ?? 0), 0) / n : 0;
  const avgRisk = n ? rows.reduce((s, r) => s + Number(r.risk_index ?? 0), 0) / n : 0;
  const avgTeamFit = n ? rows.reduce((s, r) => s + Number(r.team_fit ?? 0), 0) / n : 0;
  const avgNetwork = n ? rows.reduce((s, r) => s + Number(r.network_density ?? 0), 0) / n : 0;

  const trustDelta = Number((avgConf * 0.01).toFixed(2));
  const culture = avgTeamFit > 0 ? [`TEAM_FIT (${avgTeamFit.toFixed(2)})`] : [];
  const signals = avgNetwork > 0 ? [`NETWORK_DENSITY (${avgNetwork.toFixed(2)})`] : [];
  const abuseRisk = Number(avgRisk.toFixed(2));

  return { trustDelta, culture, signals, abuseRisk };
}
