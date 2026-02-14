import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const editJobSchema = z.object({
  jobHistoryId: z.string().uuid(),
  employerName: z.string().min(1).optional(),
  jobTitle: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isVisibleToEmployer: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = editJobSchema.parse(body);

    const supabase = await createServerSupabase();
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

    const updateData: any = {};
    if (data.employerName) updateData.company_name = data.employerName;
    if (data.jobTitle) updateData.job_title = data.jobTitle;
    if (data.startDate) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) {
      updateData.end_date = data.endDate || null;
      updateData.is_current = !data.endDate;
    }
    if (data.isVisibleToEmployer !== undefined) {
      updateData.is_visible_to_employer = data.isVisibleToEmployer;
    }

    const { data: jobHistory, error: updateError } = await supabaseAny
      .from("jobs")
      .update(updateData)
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

    return NextResponse.json({ success: true, jobHistory });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Edit job error:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 },
    );
  }
}
