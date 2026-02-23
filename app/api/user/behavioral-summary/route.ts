/**
 * GET /api/user/behavioral-summary
 * Employee-safe: returns only a human-friendly summary when behavioral_intelligence_enterprise
 * is enabled for the current user. Never exposes raw scores. Candidate-only (own profile).
 */
import { getEffectiveUser } from "@/lib/auth";
import { checkFeatureAccess } from "@/lib/feature-flags";
import { getBehavioralVector } from "@/lib/intelligence/getBehavioralVector";
import { buildBehavioralSummary } from "@/lib/intelligence/behavioralSummary";
import { NextResponse } from "next/server";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({ summary: null }, { status: 200 });
    }

    const enabled = await checkFeatureAccess("behavioral_intelligence_enterprise", {
      userId: effective.id,
    });
    if (!enabled) {
      return NextResponse.json({ summary: null }, { status: 200 });
    }

    const vector = await getBehavioralVector(effective.id);
    if (!vector) {
      return NextResponse.json({ summary: "Peer feedback is still being gathered." }, { status: 200 });
    }

    const summary = buildBehavioralSummary(vector);
    return NextResponse.json({ summary }, { status: 200 });
  } catch {
    return NextResponse.json({ summary: null }, { status: 200 });
  }
}
