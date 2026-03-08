// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/employer/candidate/[id]/timeline
 * Employer-only. Returns trust timeline events for the candidate.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
import type { TrustEventImpact } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TrustTimelineEvent = {
  id: string;
  event_type: string;
  impact: TrustEventImpact | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

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
    const { data: rows, error } = await admin.from("trust_events")
      .select("id, event_type, created_at")
      .eq("profile_id", candidateId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const raw = (rows ?? []) as unknown as { id: string; event_type: string; created_at: string }[];
    const events: TrustTimelineEvent[] = raw.map((r) => ({
      id: r.id,
      event_type: r.event_type,
      impact: null,
      metadata: null,
      created_at: r.created_at,
    }));
    return NextResponse.json({ events });
  } catch (e) {
    console.error("[employer/candidate/timeline]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
