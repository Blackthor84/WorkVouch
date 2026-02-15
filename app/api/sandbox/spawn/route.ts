import { NextRequest, NextResponse } from "next/server";
import { requireSandboxMode } from "@/lib/sandbox/apiGuard";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { supabaseServer } from "@/lib/supabase/server";
import { writeAdminAuditLog } from "@/lib/admin/audit-enterprise";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** POST /api/sandbox/spawn — type: worker | employer | pair | team. sandboxId optional (default: first active session). */
export async function POST(req: NextRequest) {
  const guard = requireSandboxMode();
  if (guard) return guard;

  try {
    const adminSession = await requireSandboxV2AdminWithRole();
    const body = await req.json().catch(() => ({}));
    const type = (body.type as string)?.toLowerCase();
    let sandboxId: string | undefined = (body.sandboxId ?? body.sandbox_id) as string | undefined;

    if (!sandboxId || typeof sandboxId !== "string") {
      const supabase = getServiceRoleClient();
      const { data: sessions } = await supabase
        .from("sandbox_sessions")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      if (Array.isArray(sessions) && sessions.length > 0) {
        sandboxId = (sessions[0] as { id: string })?.id;
      }
    }
    if (!sandboxId) {
      return NextResponse.json(
        { error: "No sandbox session. Create one from Sandbox first." },
        { status: 400 }
      );
    }
    if (!["worker", "employer", "pair", "team"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Use worker | employer | pair | team" }, { status: 400 });
    }

    const origin = getOrigin(req);
    const base = "/api/admin/sandbox-v2";
    const cookie = req.headers.get("cookie") ?? "";
    const created: { workers?: unknown[]; employers?: unknown[] } = {};

    const postEmployee = async () => {
      const res = await fetch(`${origin}${base}/generate-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ sandboxId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      return data.employee;
    };
    const postEmployer = async () => {
      const res = await fetch(`${origin}${base}/generate-employer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ sandboxId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      return data.employer;
    };

    if (type === "worker") {
      created.workers = [await postEmployee()];
    } else if (type === "employer") {
      created.employers = [await postEmployer()];
    } else if (type === "pair") {
      created.workers = [await postEmployee(), await postEmployee()];
    } else if (type === "team") {
      created.employers = [await postEmployer()];
      created.workers = [await postEmployee(), await postEmployee(), await postEmployee(), await postEmployee()];
    }

    const serverSupabase = await supabaseServer();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await writeAdminAuditLog({
      admin_user_id: adminSession.id,
      admin_email: user?.email ?? null,
      admin_role: adminSession.isSuperAdmin ? "superadmin" : "admin",
      action_type: "sandbox_spawn",
      target_type: "system",
      target_id: sandboxId,
      before_state: null,
      after_state: { type, sandbox_id: sandboxId, created },
      reason: `sandbox_spawn_${type}`,
      is_sandbox: true,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });

    return NextResponse.json(created);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Forbidden: admin or super_admin required") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
