/**
 * Admin power gate: when to show dangerous tools (Playground, AbuseSimulator, ScenarioGenerator).
 * canUseDangerousAdmin = isSandbox || (isProd && adminOverrideActive)
 */

import { ENV, isProd, isSandbox } from "@/lib/env/env";

/**
 * True when dangerous admin tools (Playground, Abuse Sim, Generators) may be shown and used.
 * - Sandbox: always true.
 * - Production: true only when founder override is active.
 */
export function getCanUseDangerousAdmin(adminOverrideActive: boolean): boolean {
  return isSandbox || (isProd && adminOverrideActive);
}

export { ENV, isProd, isSandbox };
