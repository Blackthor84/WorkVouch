/**
 * GET /api/employer/entitlements
 * Plan + free-tier simulation usage for employer UI.
 */

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { resolveEmployerDataAccess } from "@/lib/employer/employerPlanServer";
import { FREE_SIMULATION_LIMIT } from "@/lib/employer/freeTierLimits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const okEmployer = await isEmployer();
    if (!user || !okEmployer) {
      return NextResponse.json({ error: "Forbidden: Employer access required" }, { status: 403 });
    }

    const access = await resolveEmployerDataAccess(user.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { data: row } = await admin
      .from("profiles")
      .select("employer_simulation_uses")
      .eq("id", user.id)
      .maybeSingle();

    const used = Number((row as { employer_simulation_uses?: number } | null)?.employer_simulation_uses ?? 0);
    const limitedPreview = access.mode === "free_preview";
    const simulationLimit = limitedPreview ? FREE_SIMULATION_LIMIT : null;
    const simulationRemaining =
      limitedPreview && simulationLimit != null ? Math.max(0, simulationLimit - used) : null;

    return NextResponse.json({
      plan: access.plan,
      limitedPreview,
      upgradeUrl: "/enterprise/upgrade",
      employerSimulationUses: used,
      simulationLimit,
      simulationRemaining,
      unlimitedSimulations: !limitedPreview,
    });
  } catch (e) {
    console.error("[employer/entitlements]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
