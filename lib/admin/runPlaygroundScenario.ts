/**
 * Secure client-side wrapper: run playground abuse scenario via admin API (no direct supabase.rpc).
 * Admin-only; guard on the page or with user?.is_admin.
 */

export type RunPlaygroundScenarioParams = {
  employer_name?: string;
  employee_count?: number;
  mass_rehire?: boolean;
};

export async function runPlaygroundScenario(params?: RunPlaygroundScenarioParams): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/admin/playground/abuse-scenario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      employer_name: params?.employer_name ?? "Evil Corp",
      employee_count: params?.employee_count ?? 1000,
      mass_rehire: params?.mass_rehire ?? false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (data as { error?: string }).error ?? res.statusText };
  return { ok: true };
}
