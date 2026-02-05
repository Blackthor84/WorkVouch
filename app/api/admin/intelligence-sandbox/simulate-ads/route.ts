/**
 * POST /api/admin/intelligence-sandbox/simulate-ads
 * Inserts a sandbox ad campaign with simulated metrics (CTR, conversion, spend). Ad simulation only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin, validateSandboxForWrite } from "@/lib/sandbox";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id as string | undefined;
    const employerId = (body.employer_id as string) || null;
    const type = (body.type as string) === "cpm" ? "cpm" : (body.type === "sponsorship" ? "sponsorship" : "cpc");
    const impressions = Math.max(0, Number(body.impressions) || 10000);
    const ctrPct = Math.min(100, Math.max(0, Number(body.ctrPct) ?? 2)) / 100;
    const conversionPct = Math.min(100, Math.max(0, Number(body.conversionPct) ?? 5)) / 100;
    const cpcCents = Math.max(0, Number(body.cpcCents) ?? 150);

    if (!sandboxId) {
      return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    }

    await validateSandboxForWrite(sandboxId, adminId);

    const clicks = Math.round(impressions * ctrPct);
    const conversions = Math.round(clicks * conversionPct);
    const spend = type === "cpc" ? (clicks * cpcCents) / 100 : type === "cpm" ? (impressions / 1000) * (cpcCents / 10) : (impressions / 1000) * 50;

    const supabase = getSupabaseServer();
    const { data: row, error } = await supabase
      .from("sandbox_ad_campaigns")
      .insert({
        sandbox_id: sandboxId,
        employer_id: employerId,
        type,
        impressions,
        clicks,
        conversions,
        spend: Math.round(spend * 100) / 100,
      })
      .select("id, type, impressions, clicks, conversions, spend, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const r = row as SandboxAdCampaignRow;
    return NextResponse.json({
      ok: true,
      campaign_id: r.id,
      type: r.type,
      impressions: r.impressions,
      clicks: r.clicks,
      conversions: r.conversions,
      spend: r.spend,
      ctr_pct: (r.clicks / r.impressions) * 100,
      conversion_pct: r.clicks > 0 ? (r.conversions / r.clicks) * 100 : 0,
      created_at: r.created_at,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
