/**
 * POST /api/employer/simulation/consume
 * Free-tier employers: increment simulation use (max 2 lifetime counter on profiles).
 * Paid employers: no-op success.
 */

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { resolveEmployerDataAccess } from "@/lib/employer/employerPlanServer";
import { FREE_SIMULATION_LIMIT } from "@/lib/employer/freeTierLimits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
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

    if (access.mode === "full") {
      return NextResponse.json({ ok: true, unlimited: true });
    }

    const { data: row, error: fetchErr } = await admin
      .from("profiles")
      .select("employer_simulation_uses")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const used = Number((row as { employer_simulation_uses?: number } | null)?.employer_simulation_uses ?? 0);
    if (used >= FREE_SIMULATION_LIMIT) {
      return NextResponse.json(
        {
          error: "You've reached your free limit — upgrade to continue running full hiring simulations.",
          code: "SIMULATION_LIMIT",
          upgradeUrl: "/enterprise/upgrade",
        },
        { status: 403 }
      );
    }

    const next = used + 1;
    const { error: upErr } = await admin
      .from("profiles")
      .update({ employer_simulation_uses: next })
      .eq("id", user.id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      employerSimulationUses: next,
      simulationLimit: FREE_SIMULATION_LIMIT,
      simulationRemaining: Math.max(0, FREE_SIMULATION_LIMIT - next),
    });
  } catch (e) {
    console.error("[employer/simulation/consume]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
