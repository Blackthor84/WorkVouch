import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSearchUsage } from "@/lib/limits/search-limit";
import { getReportUsage } from "@/lib/limits/report-limit";

/**
 * GET /api/employer/usage
 * Get search and report usage for the current employer
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const supabaseAny = supabase as any;

    // Get employer account
    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("id, plan_tier")
      .eq("user_id", user.id)
      .single();

    if (!employerAccount) {
      return NextResponse.json(
        { error: "Employer account not found" },
        { status: 404 }
      );
    }

    const planTier = employerAccount.plan_tier || "free";

    // Get usage data
    const [searchUsage, reportUsage] = await Promise.all([
      getSearchUsage(employerAccount.id, planTier),
      getReportUsage(employerAccount.id, planTier),
    ]);

    return NextResponse.json({
      searchUsage,
      reportUsage,
    });
  } catch (error: any) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
