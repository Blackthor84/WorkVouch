import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** POST /api/sandbox/run-scenario — runs real peer-reviews + intel/metrics. Scenarios: healthy-team | toxic-manager | high-turnover | mixed-reputation */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const body = await req.json().catch(() => ({}));
  const scenario = (body.scenario as string)?.toLowerCase();
  let sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
  let workerIds = body.workerIds as string[] | undefined;

  if (!["healthy-team", "toxic-manager", "high-turnover", "mixed-reputation"].includes(scenario)) {
    return NextResponse.json(
      { error: "Invalid scenario. Use healthy-team | toxic-manager | high-turnover | mixed-reputation" },
      { status: 400 }
    );
  }

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

  try {
    if (!sandboxId) {
      const listRes = await fetch(`${origin}/api/sandbox/list`, { headers: { cookie } });
      const listData = await listRes.json().catch(() => ({}));
      sandboxId = (listData as { sandboxId?: string }).sandboxId;
    }
    if (!sandboxId) {
      return NextResponse.json({ error: "No sandbox. Generate a company first." }, { status: 400 });
    }

    if (!Array.isArray(workerIds) || workerIds.length < 2) {
      const listRes = await fetch(`${origin}/api/sandbox/list?sandboxId=${encodeURIComponent(sandboxId)}`, { headers: { cookie } });
      const listData = await listRes.json().catch(() => ({}));
      const users = (listData as { users?: { id: string; role: string }[] }).users ?? [];
      workerIds = users.filter((u) => u.role === "worker").map((u) => u.id);
    }
    if (workerIds.length < 2) {
      return NextResponse.json({ error: "Need at least 2 workers. Generate a company first." }, { status: 400 });
    }

    const peerPath = "/api/admin/sandbox-v2/peer-reviews";

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
      const sbToxic = getServiceRoleClient();
      await sbToxic.from("abuse_signals").insert({
        session_id: null,
        signal_type: "sandbox_scenario_toxic_manager",
        severity: 2,
        metadata: { sandbox_id: sandboxId, scenario: "toxic-manager" },
        is_sandbox: true,
      });
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
      const sb = getServiceRoleClient();
      await sb.from("abuse_signals").insert({
        session_id: null,
        signal_type: "sandbox_scenario_high_turnover",
        severity: 1,
        metadata: { sandbox_id: sandboxId, scenario: "high-turnover" },
        is_sandbox: true,
      });
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
    }

    await runSandboxIntelligenceRecalculation(sandboxId);
    await calculateSandboxMetrics(sandboxId);

    return NextResponse.json({ ok: true, scenario, sandboxId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
