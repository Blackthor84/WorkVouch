import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { enforceLimit } from "@/lib/enforceLimit";
import { incrementUsage } from "@/lib/usage";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { checkOrgLimits, incrementOrgUnlockCount } from "@/lib/enterprise/enforceOrgLimits";

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

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 },
      );
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("id, plan_tier, industry_type, reports_used, searches_used, seats_used, stripe_report_overage_item_id, stripe_search_overage_item_id, stripe_seat_overage_item_id")
      .eq("user_id", user.id)
      .single();
    // industry_type used by UI for emphasis ordering only; core trust score is single stored value
    if (!employerAccount) {
      return NextResponse.json(
        { error: "Employer account not found" },
        { status: 404 },
      );
    }
    const result = await enforceLimit(employerAccount as any, "searches");
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
        return NextResponse.json(
          { error: orgCheck.error ?? "Organization plan limit reached.", requiresUpgrade: orgCheck.requiresUpgrade },
          { status: 403 },
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

    // Use employer_candidate_view: no email, no private identifiers
    const { data: candidates, error: viewError } = await supabaseAny
      .from("employer_candidate_view")
      .select(
        "user_id, full_name, industry, city, state, verified_employment_count, trust_score, reference_count, aggregate_rating, rehire_eligible_count"
      )
      .ilike("full_name", `%${sanitizedQuery}%`)
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
    const { data: skillsData } = await supabaseAny
      .from("skills")
      .select("user_id, skill_name")
      .in("user_id", userIds);

    const skillsByUser = new Map<string, string[]>();
    if (skillsData) {
      (skillsData as SkillRow[]).forEach((s) => {
        if (!skillsByUser.has(s.user_id)) skillsByUser.set(s.user_id, []);
        skillsByUser.get(s.user_id)!.push(s.skill_name);
      });
    }

    const users = (candidates as { user_id: string; full_name: string | null; industry: string | null; city: string | null; state: string | null; verified_employment_count: number; trust_score: number; reference_count: number; aggregate_rating: number; rehire_eligible_count: number }[]).map((c) => ({
      id: c.user_id,
      name: c.full_name,
      industry: c.industry ?? null,
      city: c.city ?? null,
      state: c.state ?? null,
      verifiedEmploymentCount: c.verified_employment_count ?? 0,
      trustScore: c.trust_score ?? 0,
      referenceCount: c.reference_count ?? 0,
      aggregateRating: c.aggregate_rating ?? 0,
      rehireEligibleCount: c.rehire_eligible_count ?? 0,
      skills: (skillsByUser.get(c.user_id) ?? []).slice(0, 10),
    }));

    return NextResponse.json({
      users,
      employerIndustryType: employerAccount.industry_type ?? null,
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
