/**
 * GET /api/employer/candidate/[id]/hiring-outcome-status
 * Employer-only. Returns only whether to show the outcome prompt (no data exposed).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isEmployer())) {
      return NextResponse.json(
        { error: "Forbidden: Employer access required" },
        { status: 403 }
      );
    }

    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("hiring_outcome_feedback")
      .select("id")
      .eq("employer_id", user.id)
      .eq("candidate_id", candidateId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[hiring-outcome-status]", error);
      return NextResponse.json(
        { error: "Failed to check status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      showPrompt: !data,
    });
  } catch (e) {
    console.error("[hiring-outcome-status]", e);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
