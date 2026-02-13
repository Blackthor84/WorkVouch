/**
 * GET /api/user/behavioral-summary
 * Employee-safe: returns only a human-friendly summary when behavioral_intelligence_enterprise
 * is enabled for the current user. Never exposes raw scores. Candidate-only (own profile).
 */
import { getSupabaseSession } from "@/lib/supabase/server";
import { checkFeatureAccess } from "@/lib/feature-flags";
import { getBehavioralVector } from "@/lib/intelligence/getBehavioralVector";
import { buildBehavioralSummary } from "@/lib/intelligence/behavioralSummary";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ summary: null }, { status: 200 });
    }

    const enabled = await checkFeatureAccess("behavioral_intelligence_enterprise", {
      userId: session.user.id,
    });
    if (!enabled) {
      return NextResponse.json({ summary: null }, { status: 200 });
    }

    const vector = await getBehavioralVector(session.user.id);
    if (!vector) {
      return NextResponse.json({ summary: "Peer feedback is still being gathered." }, { status: 200 });
    }

    const summary = buildBehavioralSummary(vector);
    return NextResponse.json({ summary }, { status: 200 });
  } catch {
    return NextResponse.json({ summary: null }, { status: 200 });
  }
}
