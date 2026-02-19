import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { INDUSTRIES } from "@/lib/constants/industries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COMPANY_NAMES = ["Sandbox Co", "Demo Corp", "Acme Sandbox", "Beta Demo", "Playground Inc"];
const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Taylor", "Morgan"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones"];
const ROLES = ["Engineer", "Analyst", "Manager", "Designer", "Developer"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Safe success payload. Never null. */
const SAFE_SUCCESS = {
  employer_id: "",
  employee_ids: [] as string[],
  sandbox: true as const,
};

/**
 * POST /api/sandbox/generate-company
 * Creates 1 sandbox employer + 5 sandbox employees + employment links.
 * Order: session (if needed) → employer → employees → employment_records.
 * All data is sandbox-only (sandbox_* tables). Never touches production.
 */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
    const supabase = getServiceRoleClient();
    const body = await req.json().catch(() => ({}));
    let sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    if (typeof sandboxId !== "string" || !sandboxId.trim()) sandboxId = undefined;

    // 1) Get or create sandbox session
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
          .insert({
            name: "Sandbox Co",
            status: "active",
            starts_at: new Date().toISOString(),
            ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select("id")
          .single();

        if (createErr || !created?.id) {
          console.error("sandbox generate-company: session create failed", createErr);
          return NextResponse.json(
            { error: "Sandbox generation failed", ...SAFE_SUCCESS },
            { status: 500 }
          );
        }
        sandboxId = (created as { id: string }).id;
      }
    } else {
      const { data: session } = await supabase
        .from("sandbox_sessions")
        .select("id, status")
        .eq("id", sandboxId)
        .maybeSingle();

      if (!session || (session as { status?: string }).status !== "active") {
        return NextResponse.json(
          { error: "Sandbox not found or not active", ...SAFE_SUCCESS },
          { status: 400 }
        );
      }
    }

    // 2) Create employer (required columns only; no is_sandbox on sandbox_* tables)
    const company_name = pick(COMPANY_NAMES);
    const industry = pick(INDUSTRIES);
    const plan_tier = "starter";

    const { data: employerRow, error: employerErr } = await supabase
      .from("sandbox_employers")
      .insert({
        sandbox_id: sandboxId,
        company_name,
        industry,
        plan_tier,
      })
      .select("id")
      .single();

    if (employerErr || !employerRow?.id) {
      console.error("sandbox generate-company: employer insert failed", employerErr);
      return NextResponse.json(
        { error: "Sandbox generation failed", ...SAFE_SUCCESS },
        { status: 500 }
      );
    }
    const employerId = (employerRow as { id: string }).id;

    // 3) Create 5 employees
    const employeeIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const first = FIRST_NAMES[i] ?? pick(FIRST_NAMES);
      const last = LAST_NAMES[i] ?? pick(LAST_NAMES);
      const full_name = `${first} ${last}`;
      const empIndustry = pick(INDUSTRIES);

      const { data: empRow, error: empErr } = await supabase
        .from("sandbox_employees")
        .insert({
          sandbox_id: sandboxId,
          full_name,
          industry: empIndustry,
        })
        .select("id")
        .single();

      if (empErr || !empRow?.id) {
        console.error("sandbox generate-company: employee insert failed", empErr);
        continue;
      }
      employeeIds.push((empRow as { id: string }).id);
    }

    // 4) Create employment links (employee → employer). Only for created employees.
    const role = "employee";
    const tenure_months = randomInt(6, 48);
    const rehire_eligible = true;

    for (const employeeId of employeeIds) {
      await supabase.from("sandbox_employment_records").insert({
        sandbox_id: sandboxId,
        employee_id: employeeId,
        employer_id: employerId,
        role,
        tenure_months,
        rehire_eligible,
      });
    }

    return NextResponse.json({
      employer_id: employerId,
      employee_ids: employeeIds,
      sandbox: true,
      employer: { id: employerId, company_name },
      workers: employeeIds.map((id) => ({ id, full_name: "Worker" })),
      sandboxId,
    });
  } catch (err) {
    console.error("sandbox generate-company failed", err);
    return NextResponse.json(
      { error: "Sandbox generation failed", ...SAFE_SUCCESS },
      { status: 500 }
    );
  }
}
