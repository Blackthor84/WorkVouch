import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getUsageForEmployer } from "@/lib/usage";

/**
 * GET /api/employer/usage
 * Get plan and usage (reports, searches, seats) for the current employer.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;
    const { data: employerAccount } = await supabaseAny
      .from("employer_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!employerAccount) {
      return NextResponse.json(
        { error: "Employer account not found" },
        { status: 404 }
      );
    }

    const usage = await getUsageForEmployer(employerAccount.id);
    if (!usage) {
      return NextResponse.json(
        { error: "Failed to load usage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      planTier: usage.planTier,
      limits: usage.limits,
      reportsUsed: usage.reportsUsed,
      searchesUsed: usage.searchesUsed,
      seatsUsed: usage.seatsUsed,
      seatsAllowed: usage.seatsAllowed,
      billingCycleStart: usage.billingCycleStart,
      billingCycleEnd: usage.billingCycleEnd,
    });
  } catch (error: unknown) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
