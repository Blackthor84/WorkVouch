/**
 * GET /api/user/profile-strength
 * Returns employee-safe profile metrics only. No fraud, employer-only, ranking, team fit, or internal notes.
 * Risk engine computes fully in backend; this API exposes only the transparent subset for the current user.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RiskSnapshot = {
  tenure?: number;
  references?: number;
  disputes?: number;
  gaps?: number;
  rehire?: number;
  overall?: number;
  confidence?: number;
  version?: string;
};

export type ProfileStrengthResponse = {
  tenureStability: number;
  referenceResponseRate: number;
  rehireLikelihood: number;
  employmentGapClarity: number;
  disputeResolutionStatus: number;
  /** If true, snapshot was missing and defaults were returned; caller may trigger recalc. */
  fromDefaults?: boolean;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = await createServerSupabase();
    const supabaseAny = supabase as {
      from: (table: string) => {
        select: (cols: string) => { eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }> };
      };
    };

    const { data: profileData, error } = await supabaseAny
      .from("profiles")
      .select("risk_snapshot")
      .eq("id", userId);

    const list = Array.isArray(profileData) ? profileData : profileData != null ? [profileData] : [];
    const row = list[0];
    const snapshot = (row as { risk_snapshot?: RiskSnapshot } | null)?.risk_snapshot as RiskSnapshot | null | undefined;

    if (error) {
      return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
    }

    const fromDefaults = !snapshot || typeof snapshot !== "object";

    const tenureStability = clamp(snapshot?.tenure ?? 0);
    const referenceResponseRate = clamp(snapshot?.references ?? 0);
    const rehireLikelihood = clamp(snapshot?.rehire ?? 0);
    const employmentGapClarity = clamp(snapshot?.gaps ?? 100);
    const disputeResolutionStatus = clamp(snapshot?.disputes ?? 100);

    const body: ProfileStrengthResponse = {
      tenureStability,
      referenceResponseRate,
      rehireLikelihood,
      employmentGapClarity,
      disputeResolutionStatus,
    };

    if (fromDefaults) {
      body.fromDefaults = true;
    }

    return NextResponse.json(body);
  } catch (e) {
    console.error("Profile strength error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
