/**
 * GET /api/user/profile-strength
 * Returns profile strength from intelligence_snapshots (canonical). Event-driven; no stale recalc.
 */
import { getEffectiveUser } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { getSupabaseSession } from "@/lib/supabase/server";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";
import { NextResponse } from "next/server";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ProfileStrengthResponse = {
  profileStrength: number;
  lastUpdated: string | null;
};

function fallback(): NextResponse {
  return NextResponse.json({
    profileStrength: 0,
    lastUpdated: null,
  } satisfies ProfileStrengthResponse);
}

export async function GET() {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({ profileStrength: 0, lastUpdated: null } satisfies ProfileStrengthResponse);
    }

    const userId = effective.id;
    const snapshot = await getOrCreateSnapshot(userId);

    const profileStrength = Math.max(0, Math.min(100, Number(snapshot.profile_strength) || 0));
    const lastUpdated = snapshot.last_calculated_at ?? null;

    const baseData = { profileStrength, lastUpdated } satisfies ProfileStrengthResponse;
    const { session } = await getSupabaseSession();
    return NextResponse.json(applyScenario(baseData, session?.impersonation));
  } catch {
    return fallback();
  }
}
