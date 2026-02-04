/**
 * GET /api/employer/listing-summary
 * Returns counts for "Employees Who Listed You": total_listed, verified, pending.
 * Free tier: blur analytics beyond basic count (return counts only, no average_profile_strength).
 * Pro+: include average_profile_strength when plan allows.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { hasRole } from "@/lib/auth";
import { normalizeTier } from "@/lib/planLimits";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("employer"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const { data: account } = await supabaseAny.from("employer_accounts").select("id, plan_tier").eq("user_id", user.id).single();
    if (!account) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

    const employerId = (account as { id: string }).id;
    const planTier = normalizeTier((account as { plan_tier?: string }).plan_tier);
    const adminSupabase = getSupabaseServer() as any;

    const { data: rows } = await adminSupabase
      .from("employment_records")
      .select("id, user_id, verification_status")
      .eq("employer_id", employerId);

    const list = Array.isArray(rows) ? rows : [];
    const total_listed = list.length;
    const verified = list.filter((r: { verification_status: string }) => r.verification_status === "verified" || r.verification_status === "matched").length;
    const pending = list.filter((r: { verification_status: string }) => r.verification_status === "pending").length;
    const disputed = list.filter((r: { verification_status: string }) => r.verification_status === "flagged").length;

    const out: {
      total_listed: number;
      verified: number;
      pending: number;
      disputed: number;
      average_profile_strength?: number;
    } = {
      total_listed,
      verified,
      pending,
      disputed,
    };

    if (planTier !== "free" && list.length > 0) {
      const userIds = [...new Set(list.map((r: { user_id: string }) => r.user_id))];
      const { data: snapshots } = await adminSupabase.from("intelligence_snapshots").select("user_id, profile_strength").in("user_id", userIds);
      const strengths = (snapshots ?? []).filter((s: { profile_strength?: number }) => s.profile_strength != null) as { profile_strength: number }[];
      if (strengths.length > 0) {
        out.average_profile_strength = Math.round(
          strengths.reduce((a: number, s: { profile_strength: number }) => a + s.profile_strength, 0) / strengths.length
        );
      }
    }

    return NextResponse.json(out);
  } catch (e) {
    console.error("[listing-summary]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
