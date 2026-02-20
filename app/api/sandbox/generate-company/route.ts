import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  let employerId: string | null = null;
  let employeeIds: string[] = [];
  let sandboxId: string | null = null;
  let errorDetail: string | undefined;

  try {
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));
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

    // --- 3) Create 5 employees ---
    const names = ["Alex Smith", "Jordan Jones", "Sam Williams", "Taylor Brown", "Morgan Davis"];
    for (let i = 0; i < 5; i++) {
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
