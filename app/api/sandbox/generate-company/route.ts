import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";
import { canPerformSandboxMutations, getAllowedBulkCount } from "@/lib/server/sandboxMutations";
import { createSandboxProfile } from "@/lib/sandbox/createSandboxProfile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_EMPLOYEES = 5;
const DEFAULT_COMPANIES = 1;

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
 * ENABLE_SANDBOX_MUTATIONS guard; superadmin bypasses. Up to 1000 companies (employers) for superadmin.
 * All other roles locked. No NODE_ENV blocking. RLS unchanged. On DB failure, safe_mode fallback (200).
 */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const authed = await getAuthedUser();
  const role = authed?.role ?? null;

  if (!canPerformSandboxMutations(role)) {
    return NextResponse.json({ error: "Sandbox mutations are disabled" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const requestedEmployees = typeof body.employeeCount === "number" ? body.employeeCount : typeof body.employee_count === "number" ? body.employee_count : DEFAULT_EMPLOYEES;
  const requestedCompanies = typeof body.companyCount === "number" ? body.companyCount : typeof body.company_count === "number" ? body.company_count : DEFAULT_COMPANIES;
  const employeeCount = getAllowedBulkCount(role, requestedEmployees, DEFAULT_EMPLOYEES);
  const companyCount = getAllowedBulkCount(role, requestedCompanies, DEFAULT_COMPANIES);

  let employerIds: string[] = [];
  let employeeIds: string[] = [];
  let sandboxId: string | null = null;
  let errorDetail: string | undefined;
  let employerProfileId: string | null = null;
  let workerProfiles: { id: string; full_name: string }[] = [];

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

    // --- 2) Create employers (1 default; up to SANDBOX_BULK_MAX for superadmin); each backed by a profile for impersonation ---
    const employerProfileIds: string[] = [];
    for (let c = 0; c < companyCount; c++) {
      const profileId = await createSandboxProfile(supabase, {
        full_name: "Sandbox Co",
        role: "employer",
        sandbox_id: resolvedSandboxId,
      });
      const { data: employerRow, error: employerErr } = await supabase
        .from("sandbox_employers")
        .insert({ sandbox_id: resolvedSandboxId, profile_id: profileId })
        .select("id")
        .single();

      if (employerErr || !employerRow?.id) {
        throw new Error(employerErr?.message ?? "Employer insert failed");
      }
      employerIds.push((employerRow as { id: string }).id);
      employerProfileIds.push(profileId);
    }
    const employerId = employerIds[0] ?? null;
    employerProfileId = employerProfileIds[0] ?? null;

    // --- 3) Create employees (default 5; up to SANDBOX_BULK_MAX for superadmin); each backed by a profile for impersonation ---
    const baseNames = ["Alex Smith", "Jordan Jones", "Sam Williams", "Taylor Brown", "Morgan Davis"];
    const names = employeeCount <= baseNames.length
      ? baseNames.slice(0, employeeCount)
      : [...baseNames, ...Array.from({ length: employeeCount - baseNames.length }, (_, i) => `Worker ${i + 6}`)];
    workerProfiles = [];
    for (let i = 0; i < employeeCount; i++) {
      const full_name = names[i];
      const profileId = await createSandboxProfile(supabase, {
        full_name,
        role: "user",
        sandbox_id: resolvedSandboxId,
      });
      const { data: empRow, error: empErr } = await supabase
        .from("sandbox_employees")
        .insert({ sandbox_id: resolvedSandboxId, full_name, profile_id: profileId })
        .select("id")
        .single();

      if (empErr || !empRow?.id) throw new Error(empErr?.message ?? "Employee insert failed");
      employeeIds.push((empRow as { id: string }).id);
      workerProfiles.push({ id: profileId, full_name });
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
    employerIds = [fallback.employerId];
    employeeIds = fallback.employeeIds;
    sandboxId = fallback.sandboxId;
  }

  const safe_mode = (employerIds[0] ?? "").startsWith("sandbox_employer_");
  const payload = {
    sandbox: true,
    employer_id: employerIds[0] ?? "",
    employer_ids: employerIds,
    employee_ids: employeeIds,
    safe_mode,
    sandboxId,
    employer: employerIds[0] && employerProfileId
      ? { id: employerProfileId, company_name: "Sandbox Co" }
      : employerIds[0]
        ? { id: employerIds[0], company_name: "Sandbox Co" }
        : undefined,
    workers: workerProfiles.length > 0
      ? workerProfiles
      : employeeIds.map((id) => ({ id, full_name: "Worker" })),
    employers_created: employerIds.length,
    employees_created: employeeIds.length,
  };
  if (errorDetail) (payload as Record<string, unknown>).details = errorDetail;

  void logSandboxEvent({
    type: "generate_company",
    message: safe_mode
      ? "Sandbox company created (simulated). " + employerIds.length + " employer(s), " + employeeIds.length + " employees."
      : "Sandbox company created. " + employerIds.length + " employer(s), " + employeeIds.length + " employees.",
    entity_type: "company",
    sandbox_id: sandboxId ?? null,
    metadata: {
      employer_ids: employerIds,
      employees_created: employeeIds.length,
      sandboxId: sandboxId ?? undefined,
      safe_mode,
    },
  });

  return NextResponse.json(payload, { status: 200 });
}
