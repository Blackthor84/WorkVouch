/**
 * POST /api/employer/candidate/[id]/hiring-outcome
 * Employer-only. Store hiring outcome (hired, would_rehire) or dismiss. Never returns stored data.
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
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

    const body = await req.json().catch(() => ({}));
    const dismissed = body.dismissed === true;
    const hired = body.hired as boolean | undefined;
    const would_rehire = body.would_rehire as boolean | undefined;

    const supabase = await createServerSupabaseClient();

    if (dismissed) {
      const { error } = await admin.from("hiring_outcome_feedback").upsert(
        {
          employer_id: user.id,
          candidate_id: candidateId,
          hired: null,
          would_rehire: null,
          dismissed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "employer_id,candidate_id" }
      );
      if (error) {
        console.error("[hiring-outcome]", error);
        return NextResponse.json(
          { error: "Failed to save" },
          { status: 500 }
        );
      }
      return new NextResponse(null, { status: 204 });
    }

    const { error } = await admin.from("hiring_outcome_feedback").upsert(
      {
        employer_id: user.id,
        candidate_id: candidateId,
        hired: hired ?? null,
        would_rehire: would_rehire ?? null,
        dismissed: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employer_id,candidate_id" }
    );
    if (error) {
      console.error("[hiring-outcome]", error);
      return NextResponse.json(
        { error: "Failed to save" },
        { status: 500 }
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("[hiring-outcome]", e);
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }
}
