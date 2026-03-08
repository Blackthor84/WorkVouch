import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentUserRole, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { enforceLimit } from "@/lib/enforceLimit";
import { incrementUsage } from "@/lib/usage";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { checkOrgLimits, incrementOrgUnlockCount } from "@/lib/enterprise/enforceOrgLimits";
import { planLimit403Response } from "@/lib/enterprise/checkOrgLimits";
import { getOrgHealthScore } from "@/lib/scoring/orgHealthScore";
import {
  getEmployeeAuditScoresBatch,
  getAuditLabel,
  getAuditExplanation,
  compareAuditForRank,
  type AuditBand,
} from "@/lib/scoring/employeeAuditScore";
import { getTrustTrajectoryBatch } from "@/lib/trust/trustTrajectory";

const MAX_RESULTS = 50;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIsEmployer = await isEmployer();
    if (!user || !userIsEmployer) {
      return NextResponse.json(
        { error: "Forbidden: Employer access required" },
        { status: 403 },
      );
    }

    const disclaimerResponse = await requireEmployerLegalAcceptanceOrResponse(
      user.id,
      await getCurrentUserRole()
    );
    if (disclaimerResponse) return disclaimerResponse;

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 },
      );
    }

    const supabase = await createClient();
    type EmployerRow = { id: string; plan_tier: string | null };
    const { data: employerAccount } = await admin
      .from("employer_accounts")
      .select("id, plan_tier")
      .eq("user_id", user.id)
      .single()
      .returns<EmployerRow | null>();
    if (!employerAccount) {
      return NextResponse.json(
        { error: "Employer account not found" },
        { status: 404 },
      );
    }
    const result = await enforceLimit(
      { plan_tier: employerAccount.plan_tier ?? "" },
      "searches"
    );
    if (!result.allowed) {
      return NextResponse.json(
        { error: result.error || "Plan limit reached", limitReached: true },
        { status: 403 },
      );
    }

    if (subCheck.organizationId) {
      const month = new Date().toISOString().slice(0, 7);
      const orgCheck = await checkOrgLimits(
        { organizationId: subCheck.organizationId, month },
        "unlock"
      );
      if (!orgCheck.allowed) {
        const health = await getOrgHealthScore(subCheck.organizationId);
        return planLimit403Response(
          orgCheck,
          "run_check",
          { status: health.status, recommended_plan: health.recommended_plan }
        );
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query")?.trim();

    if (!query || query.length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      );
    }

    const sanitizedQuery = query.replace(/[%_]/g, "");
    if (sanitizedQuery.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 },
      );
    }

    // Use employer_candidate_view: no email, no private identifiers. Exclude restricted profiles.
    const { data: candidates, error: viewError } = await admin.from("employer_candidate_view")
      .select(
        "user_id, full_name, industry, city, state, verified_employment_count, total_employment_count, verified_employment_coverage_pct, trust_score, reference_count, aggregate_rating, rehire_eligible_count"
      )
      .ilike("full_name", `%${sanitizedQuery}%`)
      .eq("restricted_from_employer_search", false)
      .limit(MAX_RESULTS);

    if (viewError) {
      console.error("employer_candidate_view query error:", viewError);
      return NextResponse.json(
        { error: "Failed to search candidates" },
        { status: 500 },
      );
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ users: [] });
    }

    await incrementUsage(employerAccount.id, "search", 1);
    if (subCheck.organizationId) {
      incrementOrgUnlockCount(subCheck.organizationId).catch(() => {});
    }

    const userIds = (candidates as { user_id: string }[]).map((c) => c.user_id);

    type SkillRow = { user_id: string; skill_name: string };
    const [auditScoresMap, skillsResult, trajectoryMap] = await Promise.all([
      getEmployeeAuditScoresBatch(userIds),
      admin.from("skills").select("user_id, skill_name").in("user_id", userIds).returns<SkillRow[]>(),
      getTrustTrajectoryBatch(userIds),
    ]);

    const skillsData: SkillRow[] | null = skillsResult.data ?? null;
    const skillsByUser = new Map<string, string[]>();
    if (skillsData) {
      skillsData.forEach((s) => {
        if (!skillsByUser.has(s.user_id)) skillsByUser.set(s.user_id, []);
        skillsByUser.get(s.user_id)!.push(s.skill_name);
      });
    }

    type CandidateRow = {
      user_id: string;
      full_name: string | null;
      industry: string | null;
      city: string | null;
      state: string | null;
      verified_employment_count: number;
      total_employment_count: number;
      verified_employment_coverage_pct: number;
      trust_score: number;
      reference_count: number;
      aggregate_rating: number;
      rehire_eligible_count: number;
    };
    const candidateList = candidates as CandidateRow[];
    candidateList.sort((a, b) => compareAuditForRank(auditScoresMap.get(a.user_id) ?? null, auditScoresMap.get(b.user_id) ?? null));

    const users = candidateList.map((c) => {
      const audit = auditScoresMap.get(c.user_id);
      const band: AuditBand = audit?.band ?? "unverified";
      const trajectory = trajectoryMap.get(c.user_id);
      return {
        id: c.user_id,
        name: c.full_name,
        industry: c.industry ?? null,
        city: c.city ?? null,
        state: c.state ?? null,
        verifiedEmploymentCount: c.verified_employment_count ?? 0,
        totalEmploymentCount: c.total_employment_count ?? 0,
        verifiedEmploymentCoveragePct: c.verified_employment_coverage_pct ?? 0,
        trustScore: c.trust_score ?? 0,
        referenceCount: c.reference_count ?? 0,
        aggregateRating: c.aggregate_rating ?? 0,
        rehireEligibleCount: c.rehire_eligible_count ?? 0,
        skills: (skillsByUser.get(c.user_id) ?? []).slice(0, 10),
        auditScore: audit?.score ?? null,
        auditBand: band,
        auditLabel: getAuditLabel(band),
        auditExplanation: audit ? getAuditExplanation(band, audit.breakdown) : "Verification data not yet calculated.",
        trustTrajectory: trajectory?.trajectory ?? "stable",
        trustTrajectoryLabel: trajectory?.label ?? "Stable",
        trustTrajectoryTooltipFactors: trajectory?.tooltipFactors ?? [],
      };
    });

    return NextResponse.json({
      users,
      employerIndustryType: null,
    });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
