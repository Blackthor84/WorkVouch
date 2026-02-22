import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Guaranteed shape. Never return null or omit keys. user_id = profile UUID for impersonation. */
const EMPTY_LIST_PAYLOAD = {
  users: [] as { id: string; user_id: string; name: string; role: "worker" | "employer" }[],
  employers: [] as { id: string; company_name: string }[],
  employees: [] as { id: string; full_name: string }[],
  sandboxId: null as string | null,
};

/** GET /api/sandbox/list — sandboxId optional (default: first active session). Returns users for ImpersonationPanel. Never null. */
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
      return NextResponse.json(EMPTY_LIST_PAYLOAD, { status: 200 });
    }

    const [employeesRes, employersRes] = await Promise.all([
      supabase.from("sandbox_employees").select("id, full_name, profile_id").eq("sandbox_id", resolvedId),
      supabase.from("sandbox_employers").select("id, company_name, profile_id").eq("sandbox_id", resolvedId),
    ]);

    const employees = (employeesRes.data ?? []) as { id: string; full_name: string; profile_id: string | null }[];
    const employers = (employersRes.data ?? []) as { id: string; company_name: string; profile_id: string | null }[];

    // Impersonation only accepts real profile UUIDs; expose as user_id so frontend sends it.
    const users = [
      ...employees
        .filter((e) => e.profile_id)
        .map((e) => ({ id: e.profile_id!, user_id: e.profile_id!, name: e.full_name ?? "Worker", role: "worker" as const })),
      ...employers
        .filter((e) => e.profile_id)
        .map((e) => ({ id: e.profile_id!, user_id: e.profile_id!, name: e.company_name ?? "Employer", role: "employer" as const })),
    ];

    return NextResponse.json({
      users,
      employers: employers.map((e) => ({ id: e.id, company_name: e.company_name ?? "Employer" })),
      employees: employees.map((e) => ({ id: e.id, full_name: e.full_name ?? "Worker" })),
      sandboxId: resolvedId,
    });
  } catch (e: unknown) {
    console.error("[sandbox/list]", e);
    return NextResponse.json(EMPTY_LIST_PAYLOAD, { status: 200 });
  }
}
