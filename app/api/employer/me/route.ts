import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser, hasRole } from "@/lib/auth";

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

    const supabase = await createServerSupabase();

    // Type definition for employer_accounts (not in Database types yet)
    type EmployerAccountRow = {
      id: string;
      company_name: string;
      contact_email: string | null;
      plan_tier: string;
      stripe_customer_id: string | null;
      created_at: string;
    };

    const supabaseAny = supabase as any;
    const { data: employerAccount, error } = await supabaseAny
      .from("employer_accounts")
      .select("id, company_name, contact_email, plan_tier, stripe_customer_id, created_at")
      .eq("user_id", user.id)
      .single();

    if (error || !employerAccount) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 },
      );
    }

    const employerAccountTyped = employerAccount as EmployerAccountRow;

    return NextResponse.json({
      employer: {
        id: employerAccountTyped.id,
        companyName: employerAccountTyped.company_name,
        contactEmail: employerAccountTyped.contact_email ?? null,
        email: user.email,
        planTier: employerAccountTyped.plan_tier,
        stripeCustomerId: employerAccountTyped.stripe_customer_id,
        createdAt: employerAccountTyped.created_at,
      },
      planTier: employerAccountTyped.plan_tier,
    });
  } catch (error) {
    console.error("Get employer error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employer" },
      { status: 500 },
    );
  }
}
