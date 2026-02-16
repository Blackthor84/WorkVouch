import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** POST /api/sandbox/generate-company — one click: 1 employer + 5 workers, all sandbox-flagged. Uses real generate-employer/generate-employee. */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

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
      body: JSON.stringify({ name: "Sandbox Co" }),
    });
    const createData = await createRes.json().catch(() => ({}));
    const id = (createData as { data?: { id?: string } }).data?.id ?? (createData as { id?: string }).id;
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
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    const resolvedId = sandboxId && typeof sandboxId === "string" ? sandboxId : await getOrCreateSandboxId();

    const employerOut = await post("/api/admin/sandbox-v2/generate-employer", { sandboxId: resolvedId });
    const employer = (employerOut as { employer?: { id: string; company_name?: string } }).employer;
    if (!employer?.id) throw new Error("Failed to create employer");

    const workers: { id: string; full_name?: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const out = await post("/api/admin/sandbox-v2/generate-employee", { sandboxId: resolvedId });
      const emp = (out as { employee?: { id: string; full_name?: string } }).employee;
      if (emp) workers.push(emp);
    }

    return NextResponse.json({
      employer: { id: employer.id, company_name: employer.company_name ?? "Sandbox Co" },
      workers,
      sandboxId: resolvedId,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
