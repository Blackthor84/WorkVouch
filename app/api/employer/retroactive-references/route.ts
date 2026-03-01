/**
 * GET /api/employer/retroactive-references — Historical employee references for claimed employer.
 * Surfaces aggregate counts and roles; no identity exposure without consent.
 * Verification requests only with employee consent (handled elsewhere).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import type { RetroactiveReferencesSummary } from "@/lib/employer-retroactive/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn("[AUTH]", { route: "/api/employer/retroactive-references", reason: "unauthenticated" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();

    const { data: employerAccount } = await supabase
      .from("employer_accounts")
      .select("id, company_name, claimed, claim_verified")
      .eq("user_id", user.id)
      .single();

    if (!employerAccount) {
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });
    }

    const acc = employerAccount as { id: string; company_name: string; claimed: boolean; claim_verified: boolean };
    if (!acc.claimed && !acc.claim_verified) {
      return NextResponse.json({
        summary: null,
        message: "Claim your organization to see historical references.",
      });
    }

    const { data: records } = await supabase
      .from("employment_records")
      .select("id, job_title")
      .eq("employer_id", acc.id);

    const list = (records ?? []) as { id: string; job_title: string }[];
    const roleCounts = new Map<string, number>();
    for (const r of list) {
      const title = r.job_title || "Unknown role";
      roleCounts.set(title, (roleCounts.get(title) || 0) + 1);
    }
    const roleSummaries = Array.from(roleCounts.entries()).map(([jobTitle, count]) => ({
      jobTitle,
      count,
    }));

    const summary: RetroactiveReferencesSummary = {
      employerAccountId: acc.id,
      companyName: acc.company_name,
      totalRecords: list.length,
      roleSummaries,
      consentedCount: 0,
    };

    return NextResponse.json({ summary });
  } catch (e) {
    console.error("[API ERROR]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
