import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";
import { isSandboxMutationsEnabled, getAllowedBulkCount, SANDBOX_BULK_MAX } from "@/lib/server/sandboxMutations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_EMPLOYEES = 5;

/**
 * In-memory fallback when DB fails. Ensures 200 and unblocks Playground.
 */
function safeModeIds(): { employerId: string; employeeIds: string[]; sandboxId: string } {
  const t = Date.now();
  return {
    employerId: "sandbox_employer_" + t,
    employeeIds: Array.from({ length: 5 }, (_, i) => `sandbox_employee_${i}_${t}`),
    sandboxId: "sandbox_safe_" + t,
  };
}

/**
 * POST /api/sandbox/generate-company
 * Always returns 200. On DB failure, falls back to in-memory fake IDs (safe_mode: true).
 */
export async function POST(req: NextRequest) {
  if (!isSandboxMutationsEnabled()) {
    return NextResponse.json({ error: "Sandbox mutations are disabled" }, { status: 403 });
  }

  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const authed = await getAuthedUser();
  const role = authed?.role ?? null;
  const body = await req.json().catch(() => ({}));
  const requestedCount = typeof body.employeeCount === "number" ? body.employeeCount : typeof body.employee_count === "number" ? body.employee_count : DEFAULT_EMPLOYEES;
  const employeeCount = getAllowedBulkCount(role, requestedCount, DEFAULT_EMPLOYEES);

  let employerId: string | null = null;
  let employeeIds: string[] = [];
  let sandboxId: string | null = null;
  let errorDetail: string | undefined;

  try {
    const supabase = getServiceRoleClient();
    let resolvedSandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    if (typeof resolvedSandboxId !== "string" || !resolvedSandboxId.trim()) resolvedSandboxId = undefined;

    // --- 1) Get or create sandbox session ---
    if (!resolvedSandboxId) {
      const { data: existing } = await supabase
        .from("sandbox_sessions")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const existingRow = existing as { id: string } | null;
      if (existingRow?.id) {
        resolvedSandboxId = existingRow.id;
      } else {
        const { data: created, error: createErr } = await supabase
          .from("sandbox_sessions")
          .insert({ name: "Sandbox Co" })
          .select("id")
          .single();

        if (createErr || !created?.id) {
          throw new Error(createErr?.message ?? "No session id");
        }
        resolvedSandboxId = (created as { id: string }).id;
      }
    } else {
      const { data: session } = await supabase
        .from("sandbox_sessions")
        .select("id")
        .eq("id", resolvedSandboxId)
        .maybeSingle();

      if (!session?.id) {
        throw new Error("Sandbox not found: " + resolvedSandboxId);
      }
    }
    sandboxId = resolvedSandboxId;

    // --- 2) Create employer ---
    const { data: employerRow, error: employerErr } = await supabase
      .from("sandbox_employers")
      .insert({ sandbox_id: resolvedSandboxId })
      .select("id")
      .single();

    if (employerErr || !employerRow?.id) {
      throw new Error(employerErr?.message ?? "Employer insert failed");
    }
    employerId = (employerRow as { id: string }).id;

    // --- 3) Create employees (default 5; up to SANDBOX_BULK_MAX when superadmin + ENABLE_SANDBOX_MUTATIONS) ---
    const baseNames = ["Alex Smith", "Jordan Jones", "Sam Williams", "Taylor Brown", "Morgan Davis"];
    const names = employeeCount <= baseNames.length
      ? baseNames.slice(0, employeeCount)
      : [...baseNames, ...Array.from({ length: employeeCount - baseNames.length }, (_, i) => `Worker ${i + 6}`)];
    for (let i = 0; i < employeeCount; i++) {
      const { data: empRow, error: empErr } = await supabase
        .from("sandbox_employees")
        .insert({ sandbox_id: resolvedSandboxId, full_name: names[i] })
        .select("id")
        .single();

      if (empErr || !empRow?.id) throw new Error(empErr?.message ?? "Employee insert failed");
      employeeIds.push((empRow as { id: string }).id);
    }

    // --- 4) Linking (best-effort) ---
    if (employerId && employeeIds.length > 0) {
      for (const eid of employeeIds) {
        await supabase.from("sandbox_employment_records").insert({
          sandbox_id: resolvedSandboxId,
          employee_id: eid,
          employer_id: employerId,
          role: "employee",
          tenure_months: 12,
          rehire_eligible: true,
        });
      }
    }
  } catch (dbErr) {
    console.error("SANDBOX GENERATE COMPANY ROOT ERROR", dbErr);
    errorDetail = dbErr instanceof Error ? dbErr.message : String(dbErr);
    const fallback = safeModeIds();
    employerId = fallback.employerId;
    employeeIds = fallback.employeeIds;
    sandboxId = fallback.sandboxId;
  }

  const safe_mode = (employerId ?? "").startsWith("sandbox_employer_");
  const payload = {
    sandbox: true,
    employer_id: employerId ?? "",
    employee_ids: employeeIds,
    safe_mode,
    sandboxId,
    employer: employerId ? { id: employerId, company_name: "Sandbox Co" } : undefined,
    workers: employeeIds.map((id) => ({ id, full_name: "Worker" })),
    employer_created: !!employerId,
    employees_created: employeeIds.length,
  };
  if (errorDetail) (payload as Record<string, unknown>).details = errorDetail;

  void logSandboxEvent({
    type: "generate_company",
    message: safe_mode
      ? "Sandbox company created (simulated). 1 employer, 5 employees."
      : "Sandbox company created. 1 employer, " + employeeIds.length + " employees.",
    entity_type: "company",
    sandbox_id: sandboxId ?? null,
    metadata: {
      employer_id: employerId ?? "",
      employees_created: employeeIds.length,
      sandboxId: sandboxId ?? undefined,
      safe_mode,
    },
  });

  return NextResponse.json(payload, { status: 200 });
}
