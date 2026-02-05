/**
 * POST /api/admin/intelligence-sandbox/simulate-hiring
 * Runs hiring confidence for a sandbox candidate + employer. Real engine. Requires sandbox_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxAdmin, validateSandboxForWrite } from "@/lib/sandbox";
import { runEmployerCandidateIntelligence } from "@/lib/intelligence/runIntelligencePipeline";
import type { SimulationContext } from "@/lib/simulation/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id as string | undefined;
    const candidateId = body.candidate_id as string;
    const employerId = body.employer_id as string;

    if (!sandboxId) {
      return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    }
    if (!candidateId || !employerId) {
      return NextResponse.json({ error: "candidate_id and employer_id required" }, { status: 400 });
    }

    const sandbox = await validateSandboxForWrite(sandboxId, adminId);
    const context: SimulationContext = { expiresAt: sandbox.ends_at, sandboxId };

    await runEmployerCandidateIntelligence(candidateId, employerId, context ?? undefined);

    return NextResponse.json({ ok: true, message: "Hiring confidence recalculated." });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
