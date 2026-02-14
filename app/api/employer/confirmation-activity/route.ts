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

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const adminSupabase = getSupabaseServer() as any;

    const { data: account } = await supabaseAny
      .from("employer_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!account) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    const employerId = (account as { id: string }).id;

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
      const r = row as { created_at?: string; updated_at?: string };
      if (r.updated_at && r.created_at) {
        totalMs += new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
        countWithTime++;
      }
    }
    const average_confirmation_time = countWithTime > 0 ? Math.round(totalMs / countWithTime / (24 * 60 * 60 * 1000)) : 0;

    // Employment records linked to this employer
    const { data: employmentRows } = await adminSupabase
      .from("employment_records")
      .select("id, user_id, confirmation_level, verification_status, employer_id, employer_confirmation_status")
      .eq("employer_id", employerId);
    const employmentList = Array.isArray(employmentRows) ? employmentRows : [];
    const totalLinked = employmentList.length;

    const employerConfirmed = employmentList.filter((r: { employer_confirmation_status?: string; verification_status?: string }) =>
      (r as { employer_confirmation_status?: string }).employer_confirmation_status === "approved" || (r as { verification_status?: string }).verification_status === "verified").length;
    const peerConfirmed = employmentList.filter((r: { confirmation_level?: string }) => (r as { confirmation_level?: string }).confirmation_level === "peer_confirmed" || (r as { confirmation_level?: string }).confirmation_level === "multi_confirmed").length;
    const multiConfirmed = employmentList.filter((r: { confirmation_level?: string }) => (r as { confirmation_level?: string }).confirmation_level === "multi_confirmed").length;

    const percent_employer_confirmed = totalLinked > 0 ? Math.round((employerConfirmed / totalLinked) * 100) : 0;
    const percent_peer_confirmed = totalLinked > 0 ? Math.round((peerConfirmed / totalLinked) * 100) : 0;
    const percent_multi_confirmed = totalLinked > 0 ? Math.round((multiConfirmed / totalLinked) * 100) : 0;

    const userIds = [...new Set(employmentList.map((r: { user_id?: string }) => (r as { user_id?: string }).user_id).filter(Boolean))] as string[];
    let average_profile_score: number | null = null;
    if (userIds.length > 0) {
      const { data: snapshots } = await adminSupabase.from("intelligence_snapshots").select("profile_strength").in("user_id", userIds);
      const strengths = (snapshots ?? []).map((s: { profile_strength?: number }) => (s as { profile_strength?: number }).profile_strength).filter((n: unknown): n is number => typeof n === "number");
      if (strengths.length > 0) {
        average_profile_score = Math.round(strengths.reduce((a: number, b: number) => a + b, 0) / strengths.length);
      }
    }

    // Peer activity: employment_matches confirmed in last 30 days
    const employmentIds = employmentList.map((r: { id: string }) => (r as { id: string }).id);
    let new_peer_confirmations = 0;
    let new_peer_reviews = 0;
    if (employmentIds.length > 0) {
      const { count: matchCount } = await adminSupabase
        .from("employment_matches")
        .select("id", { count: "exact", head: true })
        .in("employment_record_id", employmentIds)
        .eq("match_status", "confirmed")
        .gte("updated_at", iso30);
      new_peer_confirmations = matchCount ?? 0;
      const { count: refCount } = await adminSupabase
        .from("employment_references")
        .select("id", { count: "exact", head: true })
        .in("reviewed_user_id", userIds)
        .gte("created_at", iso30);
      new_peer_reviews = refCount ?? 0;
    }

    // Disputes: opened and resolved in last 30 days (employer-related)
    const { data: disputes } = await adminSupabase
      .from("disputes")
      .select("id, status, created_at, updated_at")
      .in("related_record_id", employmentIds.length > 0 ? employmentIds : ["00000000-0000-0000-0000-000000000000"]);
    const disputeList = Array.isArray(disputes) ? disputes : [];
    const disputes_opened = disputeList.filter((d: { created_at?: string }) => d.created_at && d.created_at >= iso30).length;
    const disputes_resolved = disputeList.filter((d: { status?: string; updated_at?: string }) => {
      const status = (d as { status?: string }).status;
      const updated_at = (d as { updated_at?: string }).updated_at;
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
