/**
 * POST /api/cron/nightly-intelligence-recalc
 * Optional nightly trust score recalculation. Protected by CRON_SECRET.
 * Feature flag: ENABLE_NIGHTLY_RECALC = true | false.
 * Fetches users updated in last 24h or all active (non-deleted); recalculates via calculateProfileStrength("v1").
 * Logs INTEL_CRON_START / INTEL_CRON_SUCCESS / INTEL_CRON_FAIL. Fails safely; does not overwrite on version mismatch.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { recalculateTrustScore } from "@/lib/trustScore";
import { logIntel, LOG_TAGS } from "@/lib/core/intelligence";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const headerSecret = req.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : headerSecret ?? "";
  if (cronSecret && token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = process.env.ENABLE_NIGHTLY_RECALC === "true";
  if (!enabled) {
    return NextResponse.json(
      { ok: false, skipped: true, reason: "ENABLE_NIGHTLY_RECALC not true" },
      { status: 200 }
    );
  }

  const startMs = Date.now();
  logIntel({
    tag: LOG_TAGS.INTEL_CRON_START,
    context: "nightly_intelligence_recalc",
  });

  try {
    const sb = getSupabaseServer();
    const since = new Date();
    since.setHours(since.getHours() - 24);
    const sinceIso = since.toISOString();

    const { data: recent } = await sb
      .from("profiles")
      .select("id")
      .eq("is_deleted", false)
      .gte("updated_at", sinceIso);
    const { data: allActive } = await sb
      .from("profiles")
      .select("id")
      .eq("is_deleted", false)
      .limit(5000);
    const recentIds = new Set(((recent ?? []) as { id: string }[]).map((p) => p.id));
    const activeIds = (allActive ?? []) as { id: string }[];
    const ids = recentIds.size > 0
      ? Array.from(recentIds)
      : activeIds.map((p) => p.id);

    let success = 0;
    let fail = 0;

    for (const userId of ids) {
      try {
        await recalculateTrustScore(userId, { reason: "cron_recalc" });
        success += 1;
      } catch (e) {
        fail += 1;
        logIntel({
          tag: LOG_TAGS.INTEL_CRON_FAIL,
          context: "nightly_recalc_user",
          userId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    logIntel({
      tag: LOG_TAGS.INTEL_CRON_SUCCESS,
      context: "nightly_intelligence_recalc",
      success,
      fail,
      total: ids.length,
      durationMs: Date.now() - startMs,
    });

    return NextResponse.json({
      ok: true,
      success,
      fail,
      total: ids.length,
      durationMs: Date.now() - startMs,
    });
  } catch (e) {
    logIntel({
      tag: LOG_TAGS.INTEL_CRON_FAIL,
      context: "nightly_intelligence_recalc",
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - startMs,
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
