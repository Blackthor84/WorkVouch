import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { canFileDispute } from "@/lib/middleware/plan-enforcement-supabase";
import { z } from "zod";

type EmployerAccountRow = Pick<Database["public"]["Tables"]["employer_accounts"]["Row"], "id" | "company_name">;
type JobRow = Pick<Database["public"]["Tables"]["jobs"]["Row"], "id" | "company_name" | "user_id">;

const fileDisputeSchema = z.object({
  jobHistoryId: z.string().uuid(),
  disputeReason: z.string().min(10),
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

    // Check plan tier - only Pro can file disputes
    const hasAccess = await canFileDispute(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Filing disputes requires a Pro plan. Please upgrade." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const data = fileDisputeSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    type EmployerDisputeInsert = {
      employer_account_id: string;
      job_id: string;
      dispute_reason: string;
      status: string;
    };

    // Get employer's company name
    const { data: employerAccount, error: employerError } = await admin
      .from("employer_accounts")
      .select("id, company_name")
      .eq("user_id", user.id)
      .single()
      .overrideTypes<EmployerAccountRow>();

    if (employerError || !employerAccount) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 },
      );
    }

    // Verify job history exists and is for this employer
    const { data: jobHistory, error: jobError } = await admin
      .from("jobs")
      .select("id, company_name")
      .eq("id", data.jobHistoryId)
      .single()
      .overrideTypes<Pick<JobRow, "id" | "company_name">>();

    if (jobError || !jobHistory) {
      return NextResponse.json(
        { error: "Job history not found" },
        { status: 404 },
      );
    }

    const jobName = (jobHistory?.company_name ?? "").toLowerCase();
    const empName = (employerAccount?.company_name ?? "").toLowerCase();
    if (jobName !== empName) {
      return NextResponse.json(
        { error: "Unauthorized to dispute this job history" },
        { status: 403 },
      );
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await admin
      .from("employer_disputes")
      .insert([
        {
          employer_account_id: employerAccount!.id,
          job_id: data.jobHistoryId,
          dispute_reason: data.disputeReason,
          status: "open",
        },
      ] as EmployerDisputeInsert[])
      .select()
      .single();

    if (disputeError) {
      console.error("Create dispute error:", disputeError);
      return NextResponse.json(
        { error: "Failed to create dispute" },
        { status: 500 },
      );
    }

    // Update job history status to disputed
    await admin
      .from("jobs")
      .update({ verification_status: "disputed" })
      .eq("id", data.jobHistoryId);

    // Refresh guard credential score (Security Agency) for the candidate
    const { data: job } = await admin
      .from("jobs")
      .select("user_id")
      .eq("id", data.jobHistoryId)
      .single()
      .overrideTypes<Pick<JobRow, "user_id">>();
    const userId = job?.user_id;
    if (userId) {
      const { calculateCredentialScore } = await import("@/lib/security/credentialScore");
      try {
        await calculateCredentialScore(userId);
      } catch (err: unknown) {
        console.error("[API][file-dispute] calculateCredentialScore", { userId, err });
      }
    }

    return NextResponse.json({ success: true, dispute });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 },
      );
    }
    console.error("[API][file-dispute]", { err });
    return NextResponse.json(
      { error: "Failed to file dispute" },
      { status: 500 },
    );
  }
}
