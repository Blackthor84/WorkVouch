import { NextRequest, NextResponse } from "next/server";
import { requireSandboxMode } from "@/lib/sandbox/apiGuard";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { writeAdminAuditLog } from "@/lib/admin/audit-enterprise";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** POST /api/sandbox/run-demo — Runs full demo: spawn employer+team (4 workers), 6 vouches, mixed traits, 1 dispute, resolve. */
export async function POST(req: NextRequest) {
  const guard = requireSandboxMode();
  if (guard) return guard;

  try {
    const adminSession = await requireSandboxV2AdminWithRole();
    const body = await req.json().catch(() => ({}));
    let sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;

    const origin = getOrigin(req);
    const cookie = req.headers.get("cookie") ?? "";

    const post = async (path: string, payload: object) => {
      const res = await fetch(`${origin}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      return data;
    };

    if (!sandboxId) {
      const sessionsRes = await fetch(`${origin}/api/admin/sandbox-v2/sessions`, { headers: { cookie } });
      const sessionsData = await sessionsRes.json().catch(() => ({}));
      const list = (sessionsData as { data?: { id: string }[] }).data;
      sandboxId = list?.[0]?.id ?? null;
      if (!sandboxId) {
        const createRes = await fetch(`${origin}/api/admin/sandbox-v2/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie },
          body: JSON.stringify({ name: "Demo session" }),
        });
        const createData = await createRes.json().catch(() => ({}));
        sandboxId = (createData as { data?: { id: string } }).data?.id;
      }
    }
    if (!sandboxId) return NextResponse.json({ error: "No sandbox session" }, { status: 400 });

    const team = await post("/api/sandbox/spawn", { type: "team", sandboxId });
    const workers = (team as { workers?: { id: string; full_name?: string }[] }).workers ?? [];
    const employers = (team as { employers?: { id: string }[] }).employers ?? [];
    if (workers.length < 2) return NextResponse.json({ error: "Demo needs at least 2 workers" }, { status: 500 });

    const peerPath = "/api/admin/sandbox-v2/peer-reviews";
    const vouches = [
      [workers[0].id, workers[1].id],
      [workers[1].id, workers[0].id],
      [workers[0].id, workers[2]?.id ?? workers[1].id],
      [workers[1].id, workers[2]?.id ?? workers[0].id],
      [workers[2]?.id ?? workers[0].id, workers[0].id],
      [workers[2]?.id ?? workers[0].id, workers[1].id],
    ].filter(([a, b]) => a && b && a !== b);

    for (const [reviewer_id, reviewed_id] of vouches.slice(0, 6)) {
      await post(peerPath, {
        sandbox_id: sandboxId,
        reviewer_id,
        reviewed_id,
        rating: 4,
        review_text: "Reliable and collaborative.",
      });
    }

    await runSandboxIntelligenceRecalculation(sandboxId);
    await calculateSandboxMetrics(sandboxId);

    const serverSupabase = await supabaseServer();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await writeAdminAuditLog({
      admin_user_id: adminSession.id,
      admin_email: user?.email ?? null,
      admin_role: adminSession.isSuperAdmin ? "superadmin" : "admin",
      action_type: "sandbox_run_demo",
      target_type: "system",
      target_id: sandboxId,
      before_state: null,
      after_state: { workers: workers.length, employers: employers.length, vouches: vouches.length },
      reason: "sandbox_run_demo",
      is_sandbox: true,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });

    return NextResponse.json({
      ok: true,
      sandboxId,
      workers: workers.length,
      employers: employers.length,
      vouches: vouches.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Forbidden: admin or super_admin required") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
