/**
 * GET /api/admin/intelligence-health?days=7
 * Admin only. Integrity health dashboard: % recalc success, fraud blocks/day, avg sentiment shift, overlap failures.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";

function isAdmin(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("superadmin");
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as { roles?: string[] }).roles ?? [];
    if (!isAdmin(roles)) {
      return NextResponse.json(
        { error: "Forbidden: admin or superadmin only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const days = Math.min(30, Math.max(1, parseInt(searchParams.get("days") ?? "7", 10) || 7));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString();

    const sb = getSupabaseServer();

    const { data: events } = await sb
      .from("intelligence_health_events")
      .select("event_type, payload, created_at")
      .gte("created_at", sinceIso);

    const list = (events ?? []) as {
      event_type: string;
      payload?: Record<string, unknown>;
      created_at: string;
    }[];

    const recalcSuccess = list.filter((e) => e.event_type === "recalc_success").length;
    const recalcFail = list.filter((e) => e.event_type === "recalc_fail").length;
    const totalRecalc = recalcSuccess + recalcFail;
    const pctRecalculatedSuccessfully =
      totalRecalc > 0 ? Math.round((recalcSuccess / totalRecalc) * 10000) / 100 : null;

    const fraudBlocks = list.filter((e) => e.event_type === "fraud_block");
    const fraudBlocksPerDay = Math.round((fraudBlocks.length / days) * 100) / 100;

    const overlapFailures = list.filter((e) => e.event_type === "overlap_failure").length;
    const overlapFailuresPerDay = Math.round((overlapFailures / days) * 100) / 100;

    const sentiments: number[] = [];
    for (const e of list) {
      if (e.event_type === "recalc_success" && e.payload?.averageSentiment != null) {
        sentiments.push(Number(e.payload.averageSentiment));
      }
    }
    const averageSentimentShift =
      sentiments.length > 0
        ? Math.round((sentiments.reduce((a, b) => a + b, 0) / sentiments.length) * 100) / 100
        : null;

    return NextResponse.json({
      days,
      since: sinceIso,
      pctRecalculatedSuccessfully,
      recalcSuccess,
      recalcFail,
      totalRecalc,
      fraudBlocksPerDay,
      fraudBlocksTotal: fraudBlocks.length,
      overlapValidationFailures: overlapFailures,
      overlapValidationFailuresPerDay: overlapFailuresPerDay,
      averageSentimentShift,
    });
  } catch (e) {
    console.error("[admin intelligence-health]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
