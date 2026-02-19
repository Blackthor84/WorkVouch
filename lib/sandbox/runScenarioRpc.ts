/**
 * Run a Supabase RPC by name. Use from API routes with admin/sandbox guard.
 * When app is in sandbox, sets app.environment in DB so mutation RPCs pass assert_sandbox_environment().
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppEnvironment } from "@/lib/admin/appEnvironment";

export type RunScenarioRpcResult = { data: unknown; error: Error | null };

export async function runScenarioRpc(
  supabase: SupabaseClient,
  name: string,
  params: Record<string, unknown> = {}
): Promise<RunScenarioRpcResult> {
  if (getAppEnvironment() === "sandbox") {
    const { error: setErr } = await (supabase as any).rpc("set_app_environment", { env: "sandbox" });
    if (setErr) return { data: null, error: new Error(setErr.message) };
  }
  const { data, error } = await (supabase as any).rpc(name, params);
  if (error) return { data: null, error: new Error(error.message) };
  return { data, error: null };
}

/** Convenience: run RPC by name with no args. */
export async function runScenario(supabase: SupabaseClient, name: string): Promise<RunScenarioRpcResult> {
  return runScenarioRpc(supabase, name, {});
}
