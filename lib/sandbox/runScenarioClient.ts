/**
 * Client-side: run a scenario RPC by name via the API (no direct supabase.rpc from browser).
 * Use when you have scenario functions in DB and want to trigger them from admin/sandbox UI.
 */

export async function runScenario(name: string, params?: Record<string, unknown>): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const res = await fetch("/api/sandbox/run-rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, params: params ?? {} }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (data as { error?: string }).error ?? res.statusText };
  return { ok: true, data: (data as { data?: unknown }).data };
}
