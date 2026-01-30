import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { canRequestVerification } from "@/lib/middleware/plan-enforcement-supabase";
import { incrementUsage } from "@/lib/usage";
import { calculateEnterpriseMetrics } from "@/lib/enterpriseEngine";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

const requestVerificationSchema = z.object({
  jobHistoryId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = await hasRole("employer");
    if (!isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan tier
    const hasAccess = await canRequestVerification(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "This feature requires a paid plan. Please upgrade to Basic or Pro.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const data = requestVerificationSchema.parse(body);

    const supabase = await createServerSupabase();

    type EmployerAccountRow = {
      id: string;
      company_name: string;
      plan_tier: string;
      reports_used?: number | null;
      searches_used?: number | null;
      seats_used?: number | null;
      stripe_report_overage_item_id?: string | null;
      stripe_search_overage_item_id?: string | null;
      stripe_seat_overage_item_id?: string | null;
    };
    type VerificationRequestInsert = {
      job_id: string;
      requested_by_type: string;
      requested_by_id: string;
      status: string;
    };

    // Get employer's company name and plan tier
    const supabaseAny = supabase as any;
    const { data: employerAccount, error: employerError } = await supabaseAny
      .from("employer_accounts")
      .select("id, company_name, plan_tier, reports_used, searches_used, seats_used, stripe_report_overage_item_id, stripe_search_overage_item_id, stripe_seat_overage_item_id")
      .eq("user_id", user.id)
      .single();

    if (employerError || !employerAccount) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 },
      );
    }

    const employerAccountTyped = employerAccount as EmployerAccountRow;
    if (
      employerAccountTyped.plan_tier === "free" ||
      employerAccountTyped.plan_tier === "basic"
    ) {
      const { checkVerificationLimit } =
        await import("@/lib/utils/verification-limit");
      const limitCheck = await checkVerificationLimit(employerAccountTyped.id);
      if (!limitCheck.canVerify) {
        return NextResponse.json(
          {
            error: limitCheck.message || "Verification limit reached",
            limitReached: true,
            currentCount: limitCheck.currentCount,
            limit: limitCheck.limit,
          },
          { status: 403 },
        );
      }
    }

    // Verify job history exists and is for this employer
    const { data: jobHistory, error: jobError } = await supabaseAny
      .from("jobs")
      .select("id, company_name, user_id")
      .eq("id", data.jobHistoryId)
      .single();

    if (jobError || !jobHistory) {
      return NextResponse.json(
        { error: "Job history not found" },
        { status: 404 },
      );
    }

    type JobHistoryRow = { id: string; company_name: string; user_id?: string };
    const jobHistoryTyped = jobHistory as JobHistoryRow;

    if (
      jobHistoryTyped.company_name.toLowerCase() !==
      employerAccountTyped.company_name.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Unauthorized to request verification for this job history" },
        { status: 403 },
      );
    }

    // Create verification request
    const { data: verificationRequest, error: createError } = await supabaseAny
      .from("verification_requests")
      .insert([
        {
          job_id: data.jobHistoryId,
          requested_by_type: "employer",
          requested_by_id: employerAccountTyped.id,
          status: "pending",
        },
      ] as VerificationRequestInsert[])
      .select()
      .single();

    if (createError) {
      console.error("Create verification request error:", createError);
      return NextResponse.json(
        { error: "Failed to create verification request" },
        { status: 500 },
      );
    }

    await incrementUsage(employerAccountTyped.id, "report", 1);

    try {
      const jobUserId = jobHistoryTyped.user_id;
      if (jobUserId) {
        const metrics = await calculateEnterpriseMetrics(jobUserId, employerAccountTyped.id);
        if (metrics) {
          const adminSupabase = getSupabaseServer() as any;
          await adminSupabase.from("enterprise_metrics").insert({
            user_id: jobUserId,
            employer_id: employerAccountTyped.id,
            rehire_probability: metrics.rehire_probability,
            compatibility_score: metrics.compatibility_score,
            workforce_risk_score: metrics.workforce_risk_score,
            integrity_index: metrics.integrity_index,
          });
        }
      }
    } catch (err) {
      console.error("Silent enterprise calculation failed:", err);
    }

    // Update job history to make it visible and set status to pending
    await (supabase as any)
      .from("jobs")
      .update({
        is_visible_to_employer: true,
        verification_status: "pending",
      })
      .eq("id", data.jobHistoryId);

    return NextResponse.json({ success: true, verificationRequest });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Request verification error:", error);
    return NextResponse.json(
      { error: "Failed to request verification" },
      { status: 500 },
    );
  }
}
