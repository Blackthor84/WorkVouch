import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getUser } from "@/lib/auth/getUser";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json(
        { error: "Not an employer account" },
        { status: 403 },
      );
    }

    const { data: employerAccount, error } = await admin
      .from("employer_accounts")
      .select("id, company_name, plan_tier, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (error || !employerAccount) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 },
      );
    }

    const payload = {
      employer: {
        id: employerAccount.id,
        companyName: employerAccount.company_name,
        contactEmail: user.email ?? null,
        email: user.email,
        planTier: employerAccount.plan_tier,
        stripeCustomerId: employerAccount.stripe_customer_id ?? null,
      },
      planTier: employerAccount.plan_tier,
    };
    const authUser = await getUser();
    return NextResponse.json(applyScenario(payload, authUser?.user_metadata?.impersonation));
  } catch (error) {
    console.error("Get employer error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employer" },
      { status: 500 },
    );
  }
}
