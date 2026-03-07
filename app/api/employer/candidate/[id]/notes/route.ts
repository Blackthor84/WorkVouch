/**
 * GET /api/employer/candidate/[id]/notes — Get notes for a saved candidate.
 * PATCH /api/employer/candidate/[id]/notes — Update notes (body: { notes: string }).
 * Employer-only; notes stored in saved_candidates.notes.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disclaimer = await requireEmployerLegalAcceptanceOrResponse(user.id, await getCurrentUserRole());
    if (disclaimer) return disclaimer;
    const sub = await requireActiveSubscription(user.id);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error ?? "Subscription required" }, { status: 403 });
    }
    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("saved_candidates")
      .select("notes")
      .eq("employer_id", user.id)
      .eq("candidate_id", candidateId)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const notes = (data as { notes?: string | null } | null)?.notes ?? null;
    return NextResponse.json({ notes: notes ?? "" });
  } catch (e) {
    console.error("[employer/candidate/notes GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isEmployer())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disclaimer = await requireEmployerLegalAcceptanceOrResponse(user.id, await getCurrentUserRole());
    if (disclaimer) return disclaimer;
    const sub = await requireActiveSubscription(user.id);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error ?? "Subscription required" }, { status: 403 });
    }
    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }

    let notes: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      if (typeof body.notes === "string") notes = body.notes;
    } catch {
      // use null
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("saved_candidates")
      .upsert(
        {
          employer_id: user.id,
          candidate_id: candidateId,
          notes: notes ?? null,
          saved_at: new Date().toISOString(),
        },
        { onConflict: "employer_id,candidate_id" }
      );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ notes: notes ?? "" });
  } catch (e) {
    console.error("[employer/candidate/notes PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
