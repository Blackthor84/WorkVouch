import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, getCurrentUserRole, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { enforceLimit } from "@/lib/enforceLimit";
import { incrementUsage } from "@/lib/usage";
import { resolveEmployerDataAccess } from "@/lib/employer/employerPlanServer";
import { checkOrgLimits, incrementOrgUnlockCount } from "@/lib/enterprise/enforceOrgLimits";
import { planLimit403Response } from "@/lib/enterprise/checkOrgLimits";
import { getOrgHealthScore } from "@/lib/scoring/orgHealthScore";
import {
  hasActiveEmployerSearchFilters,
  parseEmployerSearchFilters,
  searchEmployerCandidates,
} from "@/lib/search/employerSearchService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_SEARCH_PREVIEW_CAP = 8;

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
      await getCurrentUserRole(),
    );
    if (disclaimerResponse) return disclaimerResponse;

    const access = await resolveEmployerDataAccess(user.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const limitedPreview = access.mode === "free_preview";

    type EmployerRow = { id: string; plan_tier: string | null; organization_id?: string | null };
    const { data: employerAccount } = await admin
      .from("employer_accounts")
      .select("id, plan_tier, organization_id")
      .eq("user_id", user.id)
      .single()
      .returns<EmployerRow | null>();

    if (!employerAccount) {
      return NextResponse.json({ error: "Employer account not found" }, { status: 404 });
    }

    if (!limitedPreview) {
      const result = await enforceLimit(
        { plan_tier: employerAccount.plan_tier ?? "" },
        "searches",
      );
      if (!result.allowed) {
        return NextResponse.json(
          { error: result.error || "Plan limit reached", limitReached: true },
          { status: 403 },
        );
      }
    }

    const filters = parseEmployerSearchFilters(request.nextUrl.searchParams);
    if (!hasActiveEmployerSearchFilters(filters)) {
      return NextResponse.json(
        { error: "Enter a name or at least one filter to search" },
        { status: 400 },
      );
    }

    if (filters.query) {
      const sanitized = filters.query.replace(/[%_]/g, "");
      if (sanitized.length < 2) {
        return NextResponse.json(
          { error: "Search query must be at least 2 characters" },
          { status: 400 },
        );
      }
    }

    const orgIdForLimits = limitedPreview ? null : employerAccount.organization_id ?? null;
    if (orgIdForLimits) {
      const month = new Date().toISOString().slice(0, 7);
      const orgCheck = await checkOrgLimits({ organizationId: orgIdForLimits, month }, "unlock");
      if (!orgCheck.allowed) {
        const health = await getOrgHealthScore(orgIdForLimits);
        return planLimit403Response(orgCheck, "run_check", {
          status: health.status,
          recommended_plan: health.recommended_plan,
        });
      }
    }

    const users = await searchEmployerCandidates(filters, {
      limitedPreview,
      maxResults: limitedPreview ? FREE_SEARCH_PREVIEW_CAP : undefined,
    });

    if (users.length > 0 && !limitedPreview) {
      await incrementUsage(employerAccount.id, "search", 1);
      if (orgIdForLimits) {
        incrementOrgUnlockCount(orgIdForLimits).catch(() => {});
      }
    }

    return NextResponse.json({
      users,
      employerIndustryType: null,
      ...(limitedPreview
        ? {
            entitlements: {
              tier: access.plan,
              limitedPreview: true,
              upgradeUrl: "/employer/upgrade",
              previewCap: FREE_SEARCH_PREVIEW_CAP,
            },
          }
        : {}),
    });
  } catch (error) {
    console.error("[employer/search-users]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
