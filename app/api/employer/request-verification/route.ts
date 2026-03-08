// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { canRequestVerification } from "@/lib/middleware/plan-enforcement-supabase";
import { incrementUsage } from "@/lib/usage";
import { calculateEnterpriseMetrics } from "@/lib/enterpriseEngine";
import { logAdminAction } from "@/lib/audit";
import { admin } from "@/lib/supabase-admin";
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

    const supabase = await createClient();

    type EmployerAccountRow = { id: string; company_name: string | null; plan_tier: string | null };
    type VerificationRequestInsert = {
      job_id: string;
      requested_by_type: string;
      requested_by_id: string;
      status: string;
    };

    const { data: employerAccount, error: employerError } = await admin
      .from("employer_accounts")
      .select("id, company_name, plan_tier")
      .eq("user_id", user.id)
      .single()
      .returns<EmployerAccountRow | null>();

    if (employerError || !employerAccount) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 },
      );
    }

    const tier = employerAccount.plan_tier?.toLowerCase();
    if (tier === "lite" || tier === "free" || tier === "basic" || !tier) {
      const { checkVerificationLimit } =
        await import("@/lib/utils/verification-limit");
      const limitCheck = await checkVerificationLimit(employerAccount.id);
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

    type JobHistoryRow = { id: string; company_name: string | null; user_id: string | null };
    const { data: jobHistory, error: jobError } = await admin
      .from("jobs")
      .select("id, company_name, user_id")
      .eq("id", data.jobHistoryId)
      .single()
      .returns<JobHistoryRow | null>();

    if (jobError || !jobHistory) {
      return NextResponse.json(
        { error: "Job history not found" },
        { status: 404 },
      );
    }

    const empName = (employerAccount.company_name ?? "").toLowerCase();
    const jobName = (jobHistory.company_name ?? "").toLowerCase();
    if (jobName !== empName) {
      return NextResponse.json(
        { error: "Unauthorized to request verification for this job history" },
        { status: 403 },
      );
    }

    // Create verification request
    const { data: verificationRequest, error: createError } = await admin
      .from("verification_requests")
      .insert([
        {
          job_id: data.jobHistoryId,
          requested_by_type: "employer",
          requested_by_id: employerAccount.id,
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

    await incrementUsage(employerAccount.id, "report", 1);

    try {
      const jobUserId = jobHistory.user_id;
      if (jobUserId) {
        const metrics = await calculateEnterpriseMetrics(jobUserId, employerAccount.id);
        if (metrics) {
            await admin.from("enterprise_metrics").insert({
            user_id: jobUserId,
            employer_id: employerAccount.id,
            rehire_probability: metrics.rehire_probability,
            compatibility_score: metrics.compatibility_score,
            workforce_risk_score: metrics.workforce_risk_score,
            integrity_index: metrics.integrity_index,
          });
        }
        const { triggerProfileIntelligence, triggerEmployerIntelligence } = await import("@/lib/intelligence/engines");
        try {
          await triggerProfileIntelligence(jobUserId);
          await triggerEmployerIntelligence(employerAccount.id);
        } catch (err: unknown) {
          console.error("[API][request-verification] enterprise intelligence", { jobUserId, employerId: employerAccount.id, err });
        }
      }
    } catch (err: unknown) {
      console.error("[API][request-verification] enterprise calculation", { err });
    }

    // Update job history to make it visible and set status to pending
    await admin
      .from("jobs")
      .update({
        is_visible_to_employer: true,
        verification_status: "pending",
      })
      .eq("id", data.jobHistoryId);

    await logAdminAction({
      admin_profile_id: user.id,
      action: "verification_requested",
      target_type: "organization",
      target_id: employerAccount.id,
      new_value: {
        employer_id: employerAccount.id,
        profile_id: jobHistory.user_id ?? undefined,
        details: JSON.stringify({ job_id: data.jobHistoryId }),
      },
    });

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
