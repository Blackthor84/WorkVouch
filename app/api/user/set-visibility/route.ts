import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const setVisibilitySchema = z.object({
  jobHistoryId: z.string().uuid(),
  isVisibleToEmployer: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = setVisibilitySchema.parse(body);

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

    const { data: jobHistory, error: updateError } = await supabaseAny
      .from("jobs")
      .update({ is_visible_to_employer: data.isVisibleToEmployer })
      .eq("id", data.jobHistoryId)
      .select()
      .single();

    if (updateError) {
      console.error("Set visibility error:", updateError);
      return NextResponse.json(
        { error: "Failed to update visibility" },
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

    console.error("Set visibility error:", error);
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 },
    );
  }
}
