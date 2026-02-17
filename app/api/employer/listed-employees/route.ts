/**
 * GET /api/employer/listed-employees
 * Returns former workers who listed this employer (employment_records.employer_id = current employer).
 * Excludes current employment (is_current === true) so only past workers are visible.
 * Respects profiles.employer_visibility. Plan-gated: free = basic; starter+ = verification + refs; pro+ = risk/profile; custom = full.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { hasRole } from "@/lib/auth";
import { getPlanLimits, normalizeTier } from "@/lib/planLimits";

export const dynamic = "force-dynamic";

type Visibility = "private" | "listed_only" | "verified_only" | "full";

function canEmployerSeeRecord(visibility: string | null, verificationStatus: string): boolean {
  const v = (visibility ?? "listed_only") as Visibility;
  if (v === "private") return false;
  if (v === "verified_only") return verificationStatus === "verified" || verificationStatus === "matched";
  return true;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isEmployer = await hasRole("employer");
    if (!isEmployer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const adminSupabase = getSupabaseServer() as any;

    const { data: account } = await supabaseAny
      .from("employer_accounts")
      .select("id, plan_tier")
      .eq("user_id", user.id)
      .single();
    if (!account) return NextResponse.json({ error: "Employer account not found" }, { status: 404 });

    const employerId = (account as { id: string }).id;
    const planTier = normalizeTier((account as { plan_tier?: string }).plan_tier);
    const limits = getPlanLimits(planTier);

    const { data: rows } = await adminSupabase
      .from("employment_records")
      .select("id, user_id, company_name, job_title, start_date, end_date, verification_status, created_at")
      .eq("employer_id", employerId)
      .eq("is_current", false);

    const list = Array.isArray(rows) ? rows : [];
    const userIds = [...new Set(list.map((r: { user_id: string }) => r.user_id))];

    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, full_name, employer_visibility")
      .in("id", userIds);

    const profileMap = new Map<string | number, { full_name?: string; employer_visibility?: string | null }>();
    for (const p of profiles ?? []) {
      const row = p as { id: string; full_name?: string; employer_visibility?: string | null };
      profileMap.set(row.id, { full_name: row.full_name ?? undefined, employer_visibility: row.employer_visibility ?? null });
    }

    const visible: Array<{
      record_id: string;
      user_id: string;
      name: string;
      job_title: string;
      start_date: string;
      end_date: string | null;
      verification_status: string;
      created_at: string;
      reference_count?: number;
      profile_strength?: number;
      risk_summary?: string;
    }> = [];

    for (const er of list) {
      const rec = er as { id: string; user_id: string; job_title: string; start_date: string; end_date: string | null; verification_status: string; created_at: string };
      const prof = profileMap.get(rec.user_id);
      const visibility = prof?.employer_visibility ?? "listed_only";
      if (!canEmployerSeeRecord(visibility, rec.verification_status)) continue;

      const name = prof?.full_name ?? "Unknown";
      visible.push({
        record_id: rec.id,
        user_id: rec.user_id,
        name,
        job_title: rec.job_title,
        start_date: rec.start_date,
        end_date: rec.end_date,
        verification_status: rec.verification_status,
        created_at: rec.created_at,
      });
    }

    if (planTier !== "free" && visible.length > 0) {
      const refCounts = await adminSupabase.from("employment_references").select("reviewed_user_id").in("reviewed_user_id", visible.map((v) => v.user_id));
      const refMap = new Map<string, number>();
      for (const r of refCounts.data ?? []) {
        const uid = (r as { reviewed_user_id: string }).reviewed_user_id;
        refMap.set(uid, (refMap.get(uid) ?? 0) + 1);
      }
      visible.forEach((v) => {
        v.reference_count = refMap.get(v.user_id) ?? 0;
      });
    }

    if ((planTier === "pro" || planTier === "custom") && visible.length > 0) {
      const snapIds = visible.map((v) => v.user_id);
      const { data: snapshots } = await adminSupabase.from("intelligence_snapshots").select("user_id, profile_strength").in("user_id", snapIds);
      const snapMap = new Map<string, number>();
      for (const s of snapshots ?? []) {
        const row = s as { user_id: string; profile_strength?: number };
        if (row.profile_strength != null) snapMap.set(row.user_id, row.profile_strength);
      }
      visible.forEach((v) => {
        v.profile_strength = snapMap.get(v.user_id);
      });
    }

    return NextResponse.json({
      employees: visible,
      total: visible.length,
      plan_tier: planTier,
    });
  } catch (e) {
    console.error("[listed-employees]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
