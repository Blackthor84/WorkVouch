/**
 * Client-side: call playground scenario RPCs via API (no direct supabase.rpc).
 * Admin-only; use from admin UI.
 */

const RPC_PATH = "/api/admin/playground/rpc";

async function callRpc(fn: string, params: Record<string, unknown> = {}): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const res = await fetch(RPC_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ fn, params }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (json as { error?: string }).error ?? res.statusText };
  return { ok: true, data: (json as { data?: unknown }).data };
}

/** Create scenario; returns scenario id (uuid string). */
export async function createPlaygroundScenario(name: string): Promise<{ ok: boolean; scenarioId?: string; error?: string }> {
  const out = await callRpc("create_playground_scenario", { name });
  if (!out.ok) return { ok: false, error: out.error };
  const id = out.data as string | undefined;
  return { ok: true, scenarioId: typeof id === "string" ? id : undefined };
}

/** Snapshot scenario; returns snapshot id (uuid string). */
export async function snapshotScenario(scenarioId: string): Promise<{ ok: boolean; snapshotId?: string; error?: string }> {
  const out = await callRpc("snapshot_scenario", { scenario_id: scenarioId });
  if (!out.ok) return { ok: false, error: out.error };
  const id = out.data as string | undefined;
  return { ok: true, snapshotId: typeof id === "string" ? id : undefined };
}

/** Apply mass abuse (no rehire). */
export async function abuseMassNoRehire(scenarioId: string): Promise<{ ok: boolean; error?: string }> {
  const out = await callRpc("abuse_mass_no_rehire", { scenario_id: scenarioId });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}

/** Recalc reputation for scenario. */
export async function recalcScenarioReputation(scenarioId: string): Promise<{ ok: boolean; error?: string }> {
  const out = await callRpc("recalc_scenario_reputation", { scenario_id: scenarioId });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}

/** Restore from snapshot. */
export async function restoreSnapshot(snapshotId: string): Promise<{ ok: boolean; error?: string }> {
  const out = await callRpc("restore_snapshot", { snapshot_id: snapshotId });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}

/** Nuclear reset for scenario. */
export async function resetPlaygroundScenario(scenarioId: string): Promise<{ ok: boolean; error?: string }> {
  const out = await callRpc("reset_playground_scenario", { scenario_id: scenarioId });
  return out.ok ? { ok: true } : { ok: false, error: out.error };
}
