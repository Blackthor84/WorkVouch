/**
 * Auto-employment record linking. When employee is generated, link to 1 sandbox employer with role, department, dates, verified.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { pickJobTitle, pickDepartment } from "./namePools";

export async function linkEmployeeToEmployer(params: {
  sandboxId: string;
  employeeId: string;
  employerId: string;
  role?: string;
  department?: string;
  tenureMonths?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceRoleClient();
  const role = params.role ?? pickJobTitle();
  const department = params.department ?? pickDepartment();
  const tenureMonths = params.tenureMonths ?? 12 + Math.floor(Math.random() * 36);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - tenureMonths);
  const endDate = Math.random() > 0.2 ? new Date() : null;

  const row = {
    sandbox_id: params.sandboxId,
    employee_id: params.employeeId,
    employer_id: params.employerId,
    role,
    tenure_months: tenureMonths,
    rehire_eligible: true,
    start_date: startDate.toISOString(),
    end_date: endDate ? endDate.toISOString() : null,
    department,
    verified: true,
  };

  const { error } = await supabase.from("sandbox_employment_records").insert(row).select().single();
  if (error) {
    console.error("employmentGenerator:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function linkEmployeeToRandomEmployer({
  sandboxId,
  employeeId,
}: {
  sandboxId: string;
  employeeId: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (typeof sandboxId !== "string" || typeof employeeId !== "string") {
    throw new Error("Invalid types passed to linkEmployeeToRandomEmployer");
  }
  const supabase = getServiceRoleClient();
  const { data: employers } = await supabase
    .from("sandbox_employers")
    .select("id")
    .eq("sandbox_id", sandboxId);
  const list: { id: string }[] = (employers ?? []) as { id: string }[];
  if (list.length === 0) return { ok: true };
  const employer: { id: string } = list[Math.floor(Math.random() * list.length)]!;
  return linkEmployeeToEmployer({
    sandboxId,
    employeeId,
    employerId: employer.id,
  });
}
