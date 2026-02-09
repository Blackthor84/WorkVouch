/**
 * Mode-based data adapter: production vs sandbox.
 * Use saveEmployer / saveEmployee from signup flows so we don't duplicate logic.
 * Sandbox mode writes to sandbox tables via public sandbox-signup APIs (no admin auth).
 */

import type { AppMode } from "@/lib/app-mode";

export type EmployerSignupData = {
  sandboxId?: string;
  industry: string;
  plan_tier?: string;
  company_name?: string;
};

export type EmployeeSignupData = {
  sandboxId?: string;
  industry: string;
  full_name?: string;
};

export type SaveEmployerResult = { success: boolean; error?: string; data?: unknown };
export type SaveEmployeeResult = { success: boolean; error?: string; data?: unknown };

/**
 * Save employer (signup flow). In sandbox mode calls POST /api/sandbox-signup/employer.
 * In production this is not used from public signup (production uses Supabase in select-role).
 */
export async function saveEmployer(
  data: EmployerSignupData,
  mode: AppMode
): Promise<SaveEmployerResult> {
  if (mode === "sandbox") {
    return saveSandboxEmployer(data);
  }
  return saveProductionEmployer(data);
}

/**
 * Save employee (signup flow). In sandbox mode calls POST /api/sandbox-signup/employee.
 */
export async function saveEmployee(
  data: EmployeeSignupData,
  mode: AppMode
): Promise<SaveEmployeeResult> {
  if (mode === "sandbox") {
    return saveSandboxEmployee(data);
  }
  return saveProductionEmployee(data);
}

async function saveSandboxEmployer(data: EmployerSignupData): Promise<SaveEmployerResult> {
  if (!data.sandboxId) {
    return { success: false, error: "Missing sandboxId" };
  }
  try {
    const res = await fetch("/api/sandbox-signup/employer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sandboxId: data.sandboxId,
        industry: data.industry,
        plan_tier: data.plan_tier ?? "pro",
        company_name: data.company_name,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (j as { error?: string }).error ?? "Request failed" };
    }
    return { success: true, data: (j as { data?: unknown }).data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return { success: false, error: msg };
  }
}

async function saveSandboxEmployee(data: EmployeeSignupData): Promise<SaveEmployeeResult> {
  if (!data.sandboxId) {
    return { success: false, error: "Missing sandboxId" };
  }
  try {
    const res = await fetch("/api/sandbox-signup/employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sandboxId: data.sandboxId,
        industry: data.industry,
        full_name: data.full_name,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: (j as { error?: string }).error ?? "Request failed" };
    }
    return { success: true, data: (j as { data?: unknown }).data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return { success: false, error: msg };
  }
}

/** Production path: not used from public sandbox signup; production uses Supabase in select-role. */
async function saveProductionEmployer(data: EmployerSignupData): Promise<SaveEmployerResult> {
  if (data.sandboxId) {
    throw new Error("Sandbox data must not be written to production tables.");
  }
  return { success: false, error: "Production employer signup uses select-role flow" };
}

async function saveProductionEmployee(data: EmployeeSignupData): Promise<SaveEmployeeResult> {
  if (data.sandboxId) {
    throw new Error("Sandbox data must not be written to production tables.");
  }
  return { success: false, error: "Production employee signup uses select-role flow" };
}
