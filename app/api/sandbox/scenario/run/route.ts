/**
 * POST /api/sandbox/scenario/run — run a Scenario DSL scenario. Admin-only.
 * Body: { scenario?: ScenarioDoc, scenario_id?: string, sandbox_id: string, actor_resolution?: Record<string, string>, from_step_index?: number }
 * If scenario_id is set, load from built-in scenarios; otherwise scenario must be provided.
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { runScenario } from "@/lib/sandbox/dsl/runner";
import type { ScenarioDoc } from "@/lib/sandbox/dsl/types";
import { getScenarioById } from "@/lib/sandbox/dsl/scenarios";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const authed = await getAuthedUser();
  if (!authed?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const scenario_id = body.scenario_id as string | undefined;
    const scenarioPayload = body.scenario as ScenarioDoc | undefined;
    const actor_resolution = { ...((body.actor_resolution ?? body.actorResolution) as Record<string, string>), admin: authed.user.id };
    const from_step_index = body.from_step_index as number | undefined;

    if (!sandbox_id) {
      return NextResponse.json(
        { error: "Missing sandbox_id" },
        { status: 400 }
      );
    }

    let doc: ScenarioDoc;
    if (scenario_id) {
      const builtIn = getScenarioById(scenario_id);
      if (!builtIn) {
        return NextResponse.json(
          { error: `Unknown scenario_id: ${scenario_id}` },
          { status: 400 }
        );
      }
      doc = builtIn;
    } else if (scenarioPayload?.id && scenarioPayload?.steps) {
      doc = scenarioPayload as ScenarioDoc;
    } else {
      return NextResponse.json(
        { error: "Provide either scenario_id or scenario (full ScenarioDoc)" },
        { status: 400 }
      );
    }

    if (doc.mode === "real" && body.confirm_real_mode !== true) {
      return NextResponse.json(
        { error: "Real mode requires explicit confirmation. Send confirm_real_mode: true in the request body." },
        { status: 400 }
      );
    }

    const result = await runScenario(doc, {
      sandbox_id,
      admin_user_id: authed.user.id,
      actor_resolution,
      from_step_index,
      capture_state: true,
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    console.error("[sandbox/scenario/run]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
