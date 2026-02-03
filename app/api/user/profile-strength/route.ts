/**
 * GET /api/user/profile-strength
 * Returns profile strength from intelligence_snapshots. Never crashes; always returns structured data.
 * Triggers silent background recalc if snapshot is older than 24h.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STALE_MS = 24 * 60 * 60 * 1000;

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ profileStrength: 0, lastUpdated: null } satisfies ProfileStrengthResponse);
    }

    const userId = session.user.id;
    const snapshot = await getOrCreateSnapshot(userId);

    const lastAt = snapshot.last_calculated_at ? new Date(snapshot.last_calculated_at).getTime() : 0;
    if (Date.now() - lastAt > STALE_MS) {
      calculateUserIntelligence(userId).catch(() => {});
    }

    const profileStrength = Math.max(0, Math.min(100, Number(snapshot.profile_strength) || 0));
    const lastUpdated = snapshot.last_calculated_at ?? null;

    return NextResponse.json({
      profileStrength,
      lastUpdated,
    } satisfies ProfileStrengthResponse);
  } catch {
    return fallback();
  }
}
