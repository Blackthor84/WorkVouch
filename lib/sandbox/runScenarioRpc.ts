/**
 * Run a Supabase RPC by name. Use from API routes with admin/sandbox guard.
 * RPC must exist in DB (e.g. run_scenario_healthy_team). Pass params if the function expects them.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type RunScenarioRpcResult = { data: unknown; error: Error | null };

export async function runScenarioRpc(
  supabase: SupabaseClient,
  name: string,
  params: Record<string, unknown> = {}
): Promise<RunScenarioRpcResult> {
  const { data, error } = await (supabase as any).rpc(name, params);
  if (error) return { data: null, error: new Error(error.message) };
  return { data, error: null };
}

/** Convenience: run RPC by name with no args. */
export async function runScenario(supabase: SupabaseClient, name: string): Promise<RunScenarioRpcResult> {
  return runScenarioRpc(supabase, name, {});
}
