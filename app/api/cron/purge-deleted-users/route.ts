/**
 * POST /api/cron/purge-deleted-users
 * Purge users soft-deleted 30+ days ago. Protected by CRON_SECRET.
 * Deletes auth users; profiles and dependent rows (employment_records, employment_references,
 * trust_scores, intelligence_history) cascade from auth.users / profiles.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

  try {
    const sb = getSupabaseServer();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffIso = cutoff.toISOString();

    const { data: rows, error: selectError } = await sb
      .from("profiles")
      .select("id")
      .eq("is_deleted", true)
      .lt("deleted_at", cutoffIso);

    if (selectError) {
      console.error("Purge deleted users select error:", selectError);
      return NextResponse.json(
        { error: selectError.message },
        { status: 500 }
      );
    }

    const ids = (rows ?? []) as { id: string }[];
    const toPurge = ids.map((r) => r.id);
    let purged = 0;

    for (const id of toPurge) {
      try {
        const { error } = await sb.auth.admin.deleteUser(id);
        if (error) {
          console.error("Purge deleteUser error for", id, error);
          continue;
        }
        purged += 1;
      } catch (e) {
        console.error("Purge deleteUser exception for", id, e);
      }
    }

    return NextResponse.json({
      ok: true,
      purged,
      total_eligible: toPurge.length,
    });
  } catch (e) {
    console.error("Purge deleted users error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
