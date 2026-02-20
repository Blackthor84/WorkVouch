import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KNOWN_SCENARIOS = ["healthy-team", "toxic-manager", "high-turnover", "mixed-reputation"] as const;

type ScenarioEvent = {
  type: string;
  scenario?: string;
  count?: number;
  delta?: number;
};

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Simulated events when DB fails. Always return 200. */
function simulatedEvents(scenario: string): ScenarioEvent[] {
  const s = scenario || "unknown";
  const delta = s === "toxic-manager" ? -20 : s === "high-turnover" ? -10 : +10;
  return [
    { type: "scenario_started", scenario: s },
    { type: "review_created", count: 5 },
    { type: "reputation_updated", delta },
    { type: "scenario_completed", scenario: s },
  ];
}

/**
 * POST /api/sandbox/run-scenario
 * Always returns 200. On DB/fetch failure, returns simulated events and safe_mode: true.
 */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const body = await req.json().catch(() => ({}));
  const rawScenario = (body.scenario as string)?.toLowerCase()?.trim();
  const scenario = KNOWN_SCENARIOS.includes(rawScenario as (typeof KNOWN_SCENARIOS)[number])
    ? rawScenario
    : rawScenario || "healthy-team";
  let events: ScenarioEvent[] = [];
  let safe_mode = false;

  try {
    try {
      let sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
      let workerIds = body.workerIds as string[] | undefined;
      const origin = getOrigin(req);
      const cookie = req.headers.get("cookie") ?? "";

      const post = async (path: string, payload: object) => {
        const res = await fetch(`${origin}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok && res.status !== 409) throw new Error((data as { error?: string }).error ?? res.statusText);
        return data;
      };

      if (!sandboxId) {
        const listRes = await fetch(`${origin}/api/sandbox/list`, { headers: { cookie } });
        const listData = await listRes.json().catch(() => ({}));
        sandboxId = (listData as { sandboxId?: string }).sandboxId;
      }
      if (!sandboxId) {
        events = simulatedEvents(scenario);
        safe_mode = true;
        void logSandboxEvent({
          type: "run_scenario",
          message: "Scenario run (simulated, no sandbox): " + scenario.replace(/-/g, " "),
          metadata: { scenario, safe_mode: true },
        });
        return NextResponse.json(
          { sandbox: true, scenario, events, safe_mode },
          { status: 200 }
        );
      }

      if (!Array.isArray(workerIds) || workerIds.length < 2) {
        const listRes = await fetch(`${origin}/api/sandbox/list?sandboxId=${encodeURIComponent(sandboxId)}`, {
          headers: { cookie },
        });
        const listData = await listRes.json().catch(() => ({}));
        const users = (listData as { users?: { id: string; role: string }[] }).users ?? [];
        workerIds = users.filter((u) => u.role === "worker").map((u) => u.id);
      }
      if (!workerIds || workerIds.length < 2) {
        events = simulatedEvents(scenario);
        safe_mode = true;
        void logSandboxEvent({
          type: "run_scenario",
          message: "Scenario run (simulated, no workers): " + scenario.replace(/-/g, " "),
          metadata: { scenario, safe_mode: true },
        });
        return NextResponse.json(
          { sandbox: true, scenario, events, safe_mode },
          { status: 200 }
        );
      }

      const peerPath = "/api/admin/sandbox-v2/peer-reviews";
      events.push({ type: "scenario_started", scenario });

      if (scenario === "healthy-team") {
        await post(peerPath, {
          sandbox_id: sandboxId,
          reviewer_id: workerIds[0],
          reviewed_id: workerIds[1],
          rating: 5,
          review_text: "Supportive and structured. Great teammate.",
        });
        await post(peerPath, {
          sandbox_id: sandboxId,
          reviewer_id: workerIds[1],
          reviewed_id: workerIds[0],
          rating: 5,
          review_text: "Collaborative and reliable.",
        });
        if (workerIds[2]) {
          await post(peerPath, {
            sandbox_id: sandboxId,
            reviewer_id: workerIds[0],
            reviewed_id: workerIds[2],
            rating: 4,
            review_text: "Positive influence.",
          });
        }
        events.push({ type: "review_created", count: 3 });
      }

      if (scenario === "toxic-manager") {
        await post(peerPath, {
          sandbox_id: sandboxId,
          reviewer_id: workerIds[0],
          reviewed_id: workerIds[1],
          rating: 1,
          review_text: "Poor communication and unfair treatment.",
        });
        await post(peerPath, {
          sandbox_id: sandboxId,
          reviewer_id: workerIds[1],
          reviewed_id: workerIds[0],
          rating: 2,
          review_text: "Unsupportive. High turnover risk.",
        });
        try {
          const sb = getServiceRoleClient();
          await sb.from("abuse_signals").insert({
            session_id: null,
            signal_type: "sandbox_scenario_toxic_manager",
            severity: 2,
            metadata: { sandbox_id: sandboxId, scenario: "toxic-manager" },
            is_sandbox: true,
          });
        } catch {
          // ignore
        }
        events.push({ type: "review_created", count: 2 }, { type: "reputation_updated", delta: -20 });
      }

      if (scenario === "high-turnover") {
        for (let i = 0; i < Math.min(3, workerIds.length - 1); i++) {
          await post(peerPath, {
            sandbox_id: sandboxId,
            reviewer_id: workerIds[i],
            reviewed_id: workerIds[i + 1],
            rating: 2,
            review_text: "Considering leaving. Culture issues.",
          });
        }
        try {
          const sb = getServiceRoleClient();
          await sb.from("abuse_signals").insert({
            session_id: null,
            signal_type: "sandbox_scenario_high_turnover",
            severity: 1,
            metadata: { sandbox_id: sandboxId, scenario: "high-turnover" },
            is_sandbox: true,
          });
        } catch {
          // ignore
        }
        events.push({ type: "review_created", count: 3 }, { type: "reputation_updated", delta: -10 });
      }

      if (scenario === "mixed-reputation") {
        await post(peerPath, {
          sandbox_id: sandboxId,
          reviewer_id: workerIds[0],
          reviewed_id: workerIds[1],
          rating: 5,
          review_text: "Strong performer.",
        });
        await post(peerPath, {
          sandbox_id: sandboxId,
          reviewer_id: workerIds[1],
          reviewed_id: workerIds[0],
          rating: 3,
          review_text: "Mixed experience.",
        });
        if (workerIds[2] && workerIds[3]) {
          await post(peerPath, {
            sandbox_id: sandboxId,
            reviewer_id: workerIds[2],
            reviewed_id: workerIds[3],
            rating: 2,
            review_text: "Needs improvement.",
          });
        }
        events.push({ type: "review_created", count: 3 }, { type: "reputation_updated", delta: 5 });
      }

      try {
        await runSandboxIntelligenceRecalculation(sandboxId);
      } catch {
        // ignore
      }
      try {
        await calculateSandboxMetrics(sandboxId);
      } catch {
        // ignore
      }

      events.push({ type: "scenario_completed", scenario });
      void logSandboxEvent({
        type: "run_scenario",
        message: "Scenario completed: " + scenario.replace(/-/g, " "),
        metadata: { scenario, sandboxId, safe_mode: false, events: events.length },
      });
      return NextResponse.json(
        { sandbox: true, scenario, events, safe_mode: false, sandboxId },
        { status: 200 }
      );
    } catch (dbErr) {
      console.error("SANDBOX SCENARIO DB FAILURE", dbErr);
      events = simulatedEvents(scenario);
      safe_mode = true;
      void logSandboxEvent({
        type: "run_scenario",
        message: "Scenario run (simulated): " + scenario.replace(/-/g, " "),
        metadata: { scenario, safe_mode: true },
      });
      return NextResponse.json(
        { sandbox: true, scenario, events, safe_mode },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("SANDBOX RUN SCENARIO ROOT ERROR", err);
    events = simulatedEvents(scenario);
    safe_mode = true;
    void logSandboxEvent({
      type: "run_scenario",
      message: "Scenario run (simulated): " + scenario.replace(/-/g, " "),
      metadata: { scenario, safe_mode: true },
    });
    return NextResponse.json(
      { sandbox: true, scenario, events, safe_mode },
      { status: 200 }
    );
  }
}
