import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** POST /api/sandbox/spawn — real creation via admin sandbox-v2 generate-employee/employer. All data is_sandbox. */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const body = await req.json().catch(() => ({}));
  const type = (body.type as string)?.toLowerCase() ?? "worker";
  if (!["worker", "employer", "pair", "team"].includes(type)) {
    return NextResponse.json({ error: "Invalid type. Use worker | employer | pair | team" }, { status: 400 });
  }

  const origin = getOrigin(req);
  const cookie = req.headers.get("cookie") ?? "";

  const getOrCreateSandboxId = async (): Promise<string> => {
    const listRes = await fetch(`${origin}/api/admin/sandbox-v2/sessions`, { headers: { cookie } });
    const listData = await listRes.json().catch(() => ({}));
    const sessions = (listData as { sessions?: { id: string; status?: string }[] }).sessions ?? (listData as { data?: { id: string; status?: string }[] }).data;
    const active = Array.isArray(sessions) ? sessions.find((s) => s.status === "active") : undefined;
    if (active?.id) return active.id;
    const createRes = await fetch(`${origin}/api/admin/sandbox-v2/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ name: "Playground Sandbox" }),
    });
    const createData = await createRes.json().catch(() => ({}));
    const id = (createData as { data?: { id?: string } }).data?.id;
    if (!id) throw new Error((createData as { error?: string }).error ?? "Failed to create sandbox session");
    return id;
  };

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

  try {
    const sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    const resolvedId = sandboxId && typeof sandboxId === "string" ? sandboxId : await getOrCreateSandboxId();

    const workers: unknown[] = [];
    const employers: unknown[] = [];

    if (type === "worker" || type === "pair" || type === "team") {
      const count = type === "worker" ? 1 : type === "pair" ? 2 : 4;
      for (let i = 0; i < count; i++) {
        const out = await post("/api/admin/sandbox-v2/generate-employee", { sandboxId: resolvedId });
        const emp = (out as { employee?: unknown }).employee;
        if (emp) workers.push(emp);
      }
    }
    if (type === "employer" || type === "team") {
      const out = await post("/api/admin/sandbox-v2/generate-employer", { sandboxId: resolvedId });
      const emp = (out as { employer?: unknown }).employer;
      if (emp) employers.push(emp);
    }

    return NextResponse.json({
      ok: true,
      sandboxId: resolvedId,
      workers: workers.length ? workers : undefined,
      employers: employers.length ? employers : undefined,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
