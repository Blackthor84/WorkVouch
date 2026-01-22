import { NextRequest, NextResponse } from "next/server";
import { supabaseTyped } from "@/lib/supabase-fixed";
import { getCurrentUser } from "@/lib/auth";
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

    const body = await req.json();
    const data = requestVerificationSchema.parse(body);

    const supabase = await supabaseTyped();
    const supabaseAny = supabase as any;

    // Verify ownership
    type JobRow = { id: string; user_id: string };
    const { data: existingJob, error: fetchError } = await supabaseAny
      .from("jobs")
      .select("id, user_id")
      .eq("id", data.jobHistoryId)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const existingJobTyped = existingJob as JobRow;

    if (existingJobTyped.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update job: make visible and set status to pending
    const { data: jobHistory, error: updateError } = await supabaseAny
      .from("jobs")
      .update({
        is_visible_to_employer: true,
        verification_status: "pending",
      })
      .eq("id", data.jobHistoryId)
      .select()
      .single();

    if (updateError) {
      console.error("Update job error:", updateError);
      return NextResponse.json(
        { error: "Failed to update job" },
        { status: 500 },
      );
    }

    // Create verification request
    const { data: verificationRequest, error: createError } = await supabaseAny
      .from("verification_requests")
      .insert([
        {
          job_id: data.jobHistoryId,
          requested_by_type: "user",
          requested_by_id: user.id,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Create verification request error:", createError);
      return NextResponse.json(
        { error: "Failed to create verification request" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      jobHistory,
      verificationRequest,
    });
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
