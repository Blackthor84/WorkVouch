/**
 * Nightly CRON: recalc active profiles, cleanup soft-deleted > 30d, expire sessions, orphaned sandbox.
 * Protected by SYSTEM_CRON_SECRET. [CRON_RUN]
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { auditLog } from "@/lib/auditLogger";

const CRON_SECRET = process.env.SYSTEM_CRON_SECRET;
const BATCH_SIZE = 50;
const SOFT_DELETE_DAYS = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace(/^Bearer\s+/i, "") || new URL(request.url).searchParams.get("secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    console.warn("[CRON_RUN] Unauthorized nightly-recalc attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = {
    recalcStarted: 0,
    recalcErrors: 0,
    softDeletedPurged: 0,
    sandboxSessionsExpired: 0,
    orgHealthPersisted: 0,
    errors: [] as string[],
  };

  const supabase = getServiceRoleClient();
  const supabaseAny = supabase as any;

  try {
    console.info("[CRON_RUN] Starting nightly-recalc", { timestamp: new Date().toISOString() });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SOFT_DELETE_DAYS);
    const cutoffIso = cutoff.toISOString();

    const { data: activeProfiles } = await supabaseAny
      .from("profiles")
      .select("id")
      .is("deleted_at", null)
      .limit(BATCH_SIZE);

    const ids = (activeProfiles ?? []).map((p: { id: string }) => p.id);
    summary.recalcStarted = ids.length;

    const { triggerProfileIntelligence } = await import("@/lib/intelligence/engines");
    for (const id of ids) {
      try {
        await triggerProfileIntelligence(id);
      } catch (e) {
        summary.recalcErrors += 1;
        summary.errors.push(`recalc ${id}: ${(e as Error).message}`);
      }
    }

    const { data: toPurge } = await supabaseAny
      .from("profiles")
      .select("id")
      .not("deleted_at", "is", null)
      .lt("deleted_at", cutoffIso);
    const purgeIds = (toPurge ?? []).map((p: { id: string }) => p.id);
    if (purgeIds.length > 0) {
      const { error: delErr } = await supabaseAny.from("profiles").delete().in("id", purgeIds);
      if (delErr) {
        summary.errors.push("purge: " + delErr.message);
      } else {
        summary.softDeletedPurged = purgeIds.length;
      }
    }

    try {
      const nowIso = new Date().toISOString();
      let sessionIds: string[] = [];
      const { data: sandboxExpires, error: errExpires } = await supabaseAny
        .from("sandbox_sessions")
        .select("id")
        .lt("expires_at", nowIso);
      if (!errExpires && Array.isArray(sandboxExpires)) {
        sessionIds = sandboxExpires.map((s: { id: string }) => s.id);
      } else {
        const errMsg = (errExpires as Error)?.message ?? "";
        if (/expires_at|column|42703/i.test(errMsg)) {
          const { data: sandboxEnds, error: errEnds } = await supabaseAny
            .from("sandbox_sessions")
            .select("id")
            .lt("ends_at", nowIso);
          if (!errEnds && Array.isArray(sandboxEnds)) {
            sessionIds = sandboxEnds.map((s: { id: string }) => s.id);
          } else if (errEnds) {
            summary.errors.push("sandbox_cleanup: " + (errEnds as Error).message);
          }
        } else {
          summary.errors.push("sandbox_cleanup: " + errMsg);
        }
      }
      if (sessionIds.length > 0) {
        await supabaseAny.from("sandbox_sessions").delete().in("id", sessionIds);
        summary.sandboxSessionsExpired = sessionIds.length;
      }
    } catch (sandboxErr) {
      summary.errors.push("sandbox_cleanup: " + (sandboxErr as Error).message);
    }

    try {
      const { data: orgRows } = await supabaseAny.from("organizations").select("id").limit(200);
      const orgIds = (orgRows ?? []).map((o: { id: string }) => o.id);
      const { persistOrgHealthScore, updateOrgHealth } = await import("@/lib/enterprise/orgHealthScore");
      for (const orgId of orgIds) {
        const res = await persistOrgHealthScore(orgId);
        if (!res.error) summary.orgHealthPersisted += 1;
        else summary.errors.push(`org_health ${orgId}: ${res.error}`);
        updateOrgHealth(orgId).catch(() => {});
      }
    } catch (orgHealthErr) {
      summary.errors.push("org_health: " + (orgHealthErr as Error).message);
    }

    await auditLog({
      actorRole: "cron",
      action: "cron_nightly_run",
      metadata: { summary },
    });
    console.info("[CRON_RUN] Completed", summary);
    return NextResponse.json({ success: true, summary });
  } catch (e) {
    console.error("[CRON_RUN] FAIL", e);
    summary.errors.push((e as Error).message);
    return NextResponse.json({ success: false, summary }, { status: 500 });
  }
}
