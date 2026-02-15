import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/sandbox/list — sandboxId optional (default: first active session). Returns users for ImpersonationPanel. */
export async function GET(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
    const sandboxId =
      req.nextUrl.searchParams.get("sandboxId")?.trim() ||
      req.nextUrl.searchParams.get("sandbox_id")?.trim() ||
      null;

    const supabase = getServiceRoleClient();
    let resolvedId = sandboxId;

    if (!resolvedId) {
      const { data: sessions } = await supabase
        .from("sandbox_sessions")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      resolvedId = (sessions?.[0] as { id: string } | undefined)?.id ?? null;
    }

    if (!resolvedId) {
      return NextResponse.json({ users: [] });
    }

    const [employeesRes, employersRes] = await Promise.all([
      supabase.from("sandbox_employees").select("id, full_name").eq("sandbox_id", resolvedId),
      supabase.from("sandbox_employers").select("id, company_name").eq("sandbox_id", resolvedId),
    ]);

    const employees = (employeesRes.data ?? []) as { id: string; full_name: string }[];
    const employers = (employersRes.data ?? []) as { id: string; company_name: string }[];

    const users = [
      ...employees.map((e) => ({ id: e.id, name: e.full_name ?? "Worker", role: "worker" as const })),
      ...employers.map((e) => ({ id: e.id, name: e.company_name ?? "Employer", role: "employer" as const })),
    ];

    return NextResponse.json({ users, sandboxId: resolvedId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
