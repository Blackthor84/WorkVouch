/**
 * POST /api/admin/intelligence-sandbox/recalculate
 * Re-runs runIntelligencePipeline for all sandbox profiles, recomputes profile_metrics,
 * updates intelligence_snapshots. Does not modify production logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin, validateSandboxForWrite } from "@/lib/sandbox";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";
import { runCandidateIntelligence, runEmployerCandidateIntelligence } from "@/lib/intelligence/runIntelligencePipeline";
import { persistUnifiedIntelligence } from "@/lib/intelligence/unified-intelligence";
import type { SimulationContext } from "@/lib/simulation/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id as string | undefined;

    if (!sandboxId) {
      return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    }

    const sandbox = await validateSandboxForWrite(sandboxId, adminId);
    const context: SimulationContext = { expiresAt: sandbox.ends_at, sandboxId };
    const supabase = getSupabaseServer();

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("sandbox_id", sandboxId);
    const profileIds = (profiles ?? []).map((p: { id: string }) => p.id);

    const { data: employers } = await supabase
      .from("employer_accounts")
      .select("id")
      .eq("sandbox_id", sandboxId);
    const employerIds = (employers ?? []).map((e: { id: string }) => e.id);

    let processed = 0;
    for (const userId of profileIds) {
      await calculateUserIntelligence(userId, context);
      await runCandidateIntelligence(userId, context);
      for (const employerId of employerIds) {
        await runEmployerCandidateIntelligence(userId, employerId, context);
      }
      await persistUnifiedIntelligence(userId, context);
      processed++;
    }

    return NextResponse.json({
      ok: true,
      sandbox_id: sandboxId,
      profiles_processed: processed,
      employers_count: employerIds.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
