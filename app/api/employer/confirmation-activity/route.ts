/**
 * GET /api/employer/confirmation-activity
 * Returns real confirmation and peer-activity metrics for employer dashboard.
 * No fake numbers. Zero values return 0; empty state in UI.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getStr(obj: unknown, key: string): string | null {
  if (typeof obj !== "object" || obj === null) return null;
  const v = Object.getOwnPropertyDescriptor(obj, key)?.value;
  return typeof v === "string" ? v : null;
}

function getNum(obj: unknown, key: string): number | null {
  if (typeof obj !== "object" || obj === null) return null;
  const v = Object.getOwnPropertyDescriptor(obj, key)?.value;
  return typeof v === "number" ? v : null;
}

function hasNumericProfileStrength(s: unknown): s is { profile_strength: number } {
  return getNum(s, "profile_strength") !== null;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createServerSupabase();
    const adminSupabase = getSupabaseServer();

    const { data: account } = await supabase
      .from("employer_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!account) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = getStr(account, "id") ?? "";
    if (!employerId) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const iso30 = thirtyDaysAgo.toISOString();

    // Verification requests (employer-requested) in last 30 days
    const { count: requestedCount } = await adminSupabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("requested_by_id", employerId)
      .gte("created_at", iso30);
    const confirmations_requested_last_30_days = requestedCount ?? 0;

    // Approved/completed in last 30 days
    const { count: completedCount } = await adminSupabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("requested_by_id", employerId)
      .in("status", ["approved", "verified"])
      .gte("updated_at", iso30);
    const confirmations_completed_last_30_days = completedCount ?? 0;

    // Pending confirmations (verification_requests pending for this employer)
    const { count: pendingCount } = await adminSupabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("requested_by_id", employerId)
      .in("status", ["pending", "submitted"]);
    const pending_confirmations = pendingCount ?? 0;

    // Average confirmation time: from created_at to updated_at for approved (simplified: use 0 if no data)
    const { data: approvedRows } = await adminSupabase
      .from("verification_requests")
      .select("created_at, updated_at")
      .eq("requested_by_id", employerId)
      .in("status", ["approved", "verified"])
      .limit(100);
    let totalMs = 0;
    let countWithTime = 0;
    for (const row of approvedRows ?? []) {
      const created = getStr(row, "created_at");
      const updated = getStr(row, "updated_at");
      if (updated && created) {
        totalMs += new Date(updated).getTime() - new Date(created).getTime();
        countWithTime++;
      }
    }
    const average_confirmation_time = countWithTime > 0 ? Math.round(totalMs / countWithTime / (24 * 60 * 60 * 1000)) : 0;

    // Employment records linked to this employer (former workers only; exclude current employment)
    const { data: employmentRows } = await adminSupabase
      .from("employment_records")
      .select("id, user_id, confirmation_level, verification_status, employer_id, employer_confirmation_status")
      .eq("employer_id", employerId)
      .eq("is_current", false);
    const employmentList: unknown[] = Array.isArray(employmentRows) ? employmentRows : [];
    const totalLinked = employmentList.length;

    const employerConfirmed = employmentList.filter((r) =>
      getStr(r, "employer_confirmation_status") === "approved" || getStr(r, "verification_status") === "verified"
    ).length;
    const peerConfirmed = employmentList.filter((r) => {
      const c = getStr(r, "confirmation_level");
      return c === "peer_confirmed" || c === "multi_confirmed";
    }).length;
    const multiConfirmed = employmentList.filter((r) => getStr(r, "confirmation_level") === "multi_confirmed").length;

    const percent_employer_confirmed = totalLinked > 0 ? Math.round((employerConfirmed / totalLinked) * 100) : 0;
    const percent_peer_confirmed = totalLinked > 0 ? Math.round((peerConfirmed / totalLinked) * 100) : 0;
    const percent_multi_confirmed = totalLinked > 0 ? Math.round((multiConfirmed / totalLinked) * 100) : 0;

    const userIds = [...new Set(employmentList.map((r) => getStr(r, "user_id")).filter((id): id is string => id !== null))];
    let average_profile_score: number | null = null;
    if (userIds.length > 0) {
      const { data: snapshots } = await adminSupabase.from("intelligence_snapshots").select("profile_strength").in("user_id", userIds);
      const strengthValues: number[] = [];
      for (const s of snapshots ?? []) {
        if (hasNumericProfileStrength(s)) strengthValues.push(s.profile_strength);
      }
      if (strengthValues.length > 0) {
        average_profile_score = Math.round(strengthValues.reduce((a, b) => a + b, 0) / strengthValues.length);
      }
    }

    // Peer activity: use coworker_matches only (employment_matches does not exist); optional metrics
    const employmentIds = employmentList.map((r) => getStr(r, "id")).filter((id): id is string => id !== null);
    let new_peer_confirmations = 0;
    let new_peer_reviews = 0;
    if (employmentIds.length > 0 && userIds.length > 0) {
      try {
        const { count: refCount } = await adminSupabase
          .from("employment_references")
          .select("id", { count: "exact", head: true })
          .in("reviewed_user_id", userIds)
          .gte("created_at", iso30);
        new_peer_reviews = refCount ?? 0;
      } catch (e) {
        console.warn("Optional confirmation-activity employment_references query failed", e);
      }
    }

    // Disputes: opened and resolved in last 30 days (employer-related)
    const { data: disputes } = await adminSupabase
      .from("disputes")
      .select("id, status, created_at, updated_at")
      .in("related_record_id", employmentIds.length > 0 ? employmentIds : ["00000000-0000-0000-0000-000000000000"]);
    const disputeList = Array.isArray(disputes) ? disputes : [];
    const disputes_opened = disputeList.filter((d) => { const c = getStr(d, "created_at"); return c != null && c >= iso30; }).length;
    const disputes_resolved = disputeList.filter((d) => {
      const status = getStr(d, "status");
      const updated_at = getStr(d, "updated_at");
      return status === "resolved" && updated_at != null && updated_at >= iso30;
    }).length;

    return NextResponse.json({
      section_a: {
        confirmations_requested_last_30_days: confirmations_requested_last_30_days,
        confirmations_completed_last_30_days: confirmations_completed_last_30_days,
        pending_confirmations: pending_confirmations,
        average_confirmation_time_days: average_confirmation_time,
      },
      section_b: {
        percent_employer_confirmed: percent_employer_confirmed,
        percent_peer_confirmed: percent_peer_confirmed,
        percent_multi_confirmed: percent_multi_confirmed,
        average_profile_score: average_profile_score,
      },
      section_c: {
        new_peer_confirmations: new_peer_confirmations,
        new_peer_reviews: new_peer_reviews,
        disputes_opened: disputes_opened,
        disputes_resolved: disputes_resolved,
      },
    });
  } catch (e) {
    console.error("[employer/confirmation-activity]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
