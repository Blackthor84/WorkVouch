/**
 * GET /api/user/career-health
 * Returns career health and component scores from intelligence_snapshots (canonical). Event-driven; no stale recalc.
 */
import { getSupabaseSession } from "@/lib/supabase/server";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { NextResponse } from "next/server";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type CareerHealthResponse = {
  careerHealth: number;
  components: {
    tenure: number;
    reference: number;
    rehire: number;
    dispute: number;
    network: number;
  };
};

const ZERO_COMPONENTS = {
  tenure: 0,
  reference: 0,
  rehire: 0,
  dispute: 0,
  network: 0,
};

function fallback(): NextResponse {
  return NextResponse.json({
    careerHealth: 0,
    components: { ...ZERO_COMPONENTS },
  } satisfies CareerHealthResponse);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

export async function GET() {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({
        careerHealth: 0,
        components: { ...ZERO_COMPONENTS },
      } satisfies CareerHealthResponse);
    }

    const userId = session.user.id;
    const snapshot = await getOrCreateSnapshot(userId);

    const careerHealth = clamp(Number(snapshot.career_health_score) ?? 0);
    const components = {
      tenure: clamp(Number(snapshot.tenure_score) ?? 0),
      reference: clamp(Number(snapshot.reference_score) ?? 0),
      rehire: clamp(Number(snapshot.rehire_score) ?? 0),
      dispute: clamp(Number(snapshot.dispute_score) ?? 0),
      network: clamp(Number(snapshot.network_density_score) ?? 0),
    };

    return NextResponse.json({
      careerHealth,
      components,
    } satisfies CareerHealthResponse);
  } catch {
    return fallback();
  }
}
