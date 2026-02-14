/**
 * GET /api/admin/org-health
 * Super admin only. Returns silent org health (score, band, top signals) for all orgs.
 * Not exposed to orgs or users. No customer-facing copy or UI.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";

function topSignals(signals: Record<string, unknown>, max = 5): Record<string, unknown> {
  const entries = Object.entries(signals).filter(([, v]) => v !== undefined && v !== null);
  const byImpact = entries
    .map(([k, v]) => {
      const num = typeof v === "number" ? Math.abs(v) : (v ? 1 : 0);
      return [k, v, num] as const;
    })
    .sort((a, b) => b[2] - a[2])
    .slice(0, max);
  return Object.fromEntries(byImpact.map(([k, v]) => [k, v]));
}

export async function GET() {
  const _session = await requireSuperAdminForApi();
  if (!_session) return adminForbiddenResponse();

  const supabase = getSupabaseServer();
  const { data: rows, error } = await supabase
    .from("organization_health")
    .select("organization_id, score, band, signals, last_calculated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orgIds = [...new Set((rows ?? []).map((r: { organization_id: string }) => r.organization_id))];
  if (orgIds.length === 0) {
    return NextResponse.json({ orgs: [] });
  }

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, plan_type")
    .in("id", orgIds);

  const planByOrg = new Map(
    (orgs ?? []).map((o: { id: string; plan_type: string | null }) => [o.id, o.plan_type ?? "unknown"])
  );

  const orgsList = (rows ?? []).map((r: { organization_id: string; score: number; band: string; signals: Record<string, unknown>; last_calculated_at: string }) => ({
    org_id: r.organization_id,
    plan: planByOrg.get(r.organization_id) ?? "unknown",
    score: r.score,
    band: r.band,
    top_signals: topSignals(r.signals ?? {}),
    last_calculated_at: r.last_calculated_at,
  }));

  return NextResponse.json({ orgs: orgsList });
}
