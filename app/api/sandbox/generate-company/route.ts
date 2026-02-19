import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Minimal success shape. Returned on 200 even in degraded mode. */
function successPayload(opts: {
  sandbox: true;
  employer_created: boolean;
  employees_created: number;
  employer_id?: string;
  employee_ids?: string[];
  sandboxId?: string;
  linking_created?: boolean;
}) {
  return {
    sandbox: true,
    employer_created: opts.employer_created,
    employees_created: opts.employees_created,
    employer_id: opts.employer_id ?? "",
    employee_ids: opts.employee_ids ?? [],
    sandboxId: opts.sandboxId ?? null,
    linking_created: opts.linking_created ?? false,
    employer: opts.employer_id ? { id: opts.employer_id, company_name: "Sandbox Co" } : undefined,
    workers: (opts.employee_ids ?? []).map((id) => ({ id, full_name: "Worker" })),
  };
}

/**
 * POST /api/sandbox/generate-company
 * Creates 1 sandbox employer + 5 sandbox employees. Linking is best-effort.
 * Uses only minimal columns (no enums, no optional columns). Never throws.
 */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));
    let sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    if (typeof sandboxId !== "string" || !sandboxId.trim()) sandboxId = undefined;

    // --- 1) Get or create sandbox session (minimal: name only) ---
    if (!sandboxId) {
      const { data: existing } = await supabase
        .from("sandbox_sessions")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const existingRow = existing as { id: string } | null;
      if (existingRow?.id) {
        sandboxId = existingRow.id;
      } else {
        const { data: created, error: createErr } = await supabase
          .from("sandbox_sessions")
          .insert({ name: "Sandbox Co" })
          .select("id")
          .single();

        if (createErr || !created?.id) {
          console.error("SANDBOX GENERATE COMPANY ERROR", { stage: "session", error: createErr });
          return NextResponse.json(
            {
              error: "Sandbox generation failed",
              details: createErr?.message ?? (created ? "" : "No session id"),
              ...successPayload({ sandbox: true, employer_created: false, employees_created: 0 }),
            },
            { status: 500 }
          );
        }
        sandboxId = (created as { id: string }).id;
      }
    } else {
      const { data: session } = await supabase
        .from("sandbox_sessions")
        .select("id")
        .eq("id", sandboxId)
        .maybeSingle();

      if (!session?.id) {
        return NextResponse.json(
          {
            error: "Sandbox not found",
            details: "No session with id " + sandboxId,
            ...successPayload({ sandbox: true, employer_created: false, employees_created: 0 }),
          },
          { status: 400 }
        );
      }
    }

    // --- 2) Create employer (only required: sandbox_id) ---
    let employerId: string | undefined;
    const { data: employerRow, error: employerErr } = await supabase
      .from("sandbox_employers")
      .insert({ sandbox_id: sandboxId })
      .select("id")
      .single();

    if (employerErr || !employerRow?.id) {
      console.error("SANDBOX GENERATE COMPANY ERROR", { stage: "employer", error: employerErr });
      return NextResponse.json(
        {
          error: "Sandbox generation failed",
          details: employerErr?.message ?? "Employer insert failed",
          ...successPayload({
            sandbox: true,
            employer_created: false,
            employees_created: 0,
            sandboxId,
          }),
        },
        { status: 500 }
      );
    }
    employerId = (employerRow as { id: string }).id;

    // --- 3) Create 5 employees (only sandbox_id + full_name as string) ---
    const employeeIds: string[] = [];
    const names = ["Alex Smith", "Jordan Jones", "Sam Williams", "Taylor Brown", "Morgan Davis"];
    for (let i = 0; i < 5; i++) {
      const full_name = names[i];
      const { data: empRow, error: empErr } = await supabase
        .from("sandbox_employees")
        .insert({ sandbox_id: sandboxId, full_name })
        .select("id")
        .single();

      if (empErr || !empRow?.id) {
        console.error("SANDBOX GENERATE COMPANY ERROR", { stage: "employee", index: i, error: empErr });
        continue;
      }
      employeeIds.push((empRow as { id: string }).id);
    }

    // --- 4) Linking: best-effort; do not fail the request ---
    let linkingCreated = false;
    if (employerId && employeeIds.length > 0) {
      for (const employeeId of employeeIds) {
        const { error: linkErr } = await supabase.from("sandbox_employment_records").insert({
          sandbox_id: sandboxId,
          employee_id: employeeId,
          employer_id: employerId,
          role: "employee",
          tenure_months: 12,
          rehire_eligible: true,
        });
        if (!linkErr) linkingCreated = true;
        else console.error("SANDBOX GENERATE COMPANY ERROR", { stage: "link", employeeId, error: linkErr });
      }
    }

    return NextResponse.json(
      successPayload({
        sandbox: true,
        employer_created: true,
        employees_created: employeeIds.length,
        employer_id: employerId,
        employee_ids: employeeIds,
        sandboxId,
        linking_created: linkingCreated,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("SANDBOX GENERATE COMPANY ERROR", err);
    return NextResponse.json(
      {
        error: "Sandbox generation failed",
        details: err instanceof Error ? err.message : String(err),
        ...successPayload({ sandbox: true, employer_created: false, employees_created: 0 }),
      },
      { status: 500 }
    );
  }
}
