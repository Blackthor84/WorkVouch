/**
 * POST /api/sandbox/fuzzer/runs/[id]/replay — replay scenario from step. Admin-only.
 * Body: { from_step_index: number }
 * Uses stored scenario_doc and actor_resolution from the run's result_summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { getFuzzRun } from "@/lib/sandbox/dsl/fuzzer/runFuzzer";
import { runScenario } from "@/lib/sandbox/dsl/runner";
import type { ScenarioDoc } from "@/lib/sandbox/dsl/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const authed = await getAuthedUser();
  if (!authed?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing run id" }, { status: 400 });
  }

  try {
    const run = await getFuzzRun(id);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    const summary = (run as { result_summary?: Record<string, unknown> }).result_summary;
    const scenario_doc = summary?.scenario_doc as ScenarioDoc | undefined;
    const actor_resolution = summary?.actor_resolution as Record<string, string> | undefined;
    const sandbox_id = (run as { sandbox_id?: string }).sandbox_id;
    if (!scenario_doc?.steps || !actor_resolution || !sandbox_id) {
      return NextResponse.json(
        { error: "Run has no stored scenario or actor_resolution for replay" },
        { status: 400 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const from_step_index = Math.max(0, Number(body.from_step_index) ?? 0);
    const resolution = { ...actor_resolution, admin: authed.user.id };

    const result = await runScenario(scenario_doc, {
      sandbox_id,
      admin_user_id: authed.user.id,
      actor_resolution: resolution,
      from_step_index,
      capture_state: true,
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sandbox/fuzzer/runs/[id]/replay]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
