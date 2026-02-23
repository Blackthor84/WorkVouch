/**
 * Maps scenario keys to injector functions. Admin-only; in-memory layering over real base data.
 * Injectors are not implemented here — register or import them separately.
 */

import type { ImpersonationSimulationContext } from "./context";
import { EMPLOYEE_INJECTORS_01_05 } from "./injectors/employeeInjectors";
import { EMPLOYER_INJECTORS_01_05 } from "./injectors/employerInjectors";

/** Base payload passed into an injector (real data from DB). Injector layers scenario data on top. */
export type ScenarioInjectorBase = Record<string, unknown>;

/** Result of an injector (same shape or extended; never persisted). */
export type ScenarioInjectorResult = Record<string, unknown>;

/**
 * Injector function: given simulation context and real base data, returns in-memory overlay.
 * Must be pure/synchronous or async; must not write to the database.
 */
export type ScenarioInjector = (
  context: ImpersonationSimulationContext,
  base: ScenarioInjectorBase
) => ScenarioInjectorResult | Promise<ScenarioInjectorResult>;

/** Stub injector until real injectors are implemented. */
const stubInjector: ScenarioInjector = (_context, base) => {
  return { ...base };
};

const EMPLOYEE_KEYS = [
  "employee_01", "employee_02", "employee_03", "employee_04", "employee_05",
  "employee_06", "employee_07", "employee_08", "employee_09", "employee_10",
  "employee_11", "employee_12", "employee_13", "employee_14", "employee_15",
] as const;

const EMPLOYER_KEYS = [
  "employer_01", "employer_02", "employer_03", "employer_04", "employer_05",
  "employer_06", "employer_07", "employer_08", "employer_09", "employer_10",
  "employer_11", "employer_12", "employer_13", "employer_14", "employer_15",
] as const;

export type EmployeeScenarioKey = (typeof EMPLOYEE_KEYS)[number];
export type EmployerScenarioKey = (typeof EMPLOYER_KEYS)[number];
export type ScenarioKey = EmployeeScenarioKey | EmployerScenarioKey;

export const EMPLOYEE_SCENARIO_KEYS: readonly EmployeeScenarioKey[] = EMPLOYEE_KEYS;
export const EMPLOYER_SCENARIO_KEYS: readonly EmployerScenarioKey[] = EMPLOYER_KEYS;

const ALL_KEYS: readonly ScenarioKey[] = [...EMPLOYEE_KEYS, ...EMPLOYER_KEYS];
export const SCENARIO_KEYS: readonly ScenarioKey[] = ALL_KEYS;

/** Map of scenario key -> injector. Replace stub with real injectors when implemented. */
const injectorMap: Record<ScenarioKey, ScenarioInjector> = {} as Record<ScenarioKey, ScenarioInjector>;

for (const key of ALL_KEYS) {
  injectorMap[key] = stubInjector;
}

for (const { key, injector } of EMPLOYEE_INJECTORS_01_05) {
  injectorMap[key] = injector;
}
for (const { key, injector } of EMPLOYER_INJECTORS_01_05) {
  injectorMap[key] = injector;
}

/**
 * Resolve the injector for a scenario key. Returns null if key is invalid.
 */
export function getInjectorForKey(key: string): ScenarioInjector | null {
  if (ALL_KEYS.includes(key as ScenarioKey)) {
    return injectorMap[key as ScenarioKey];
  }
  return null;
}

/**
 * Resolve injector for the given context (uses context.scenario and context.actorType).
 * Returns null if scenario key is invalid or does not match actor type.
 */
export function resolveScenarioInjector(
  context: ImpersonationSimulationContext
): ScenarioInjector | null {
  const key = context.scenario;
  if (!key) return null;
  if (context.actorType === "employee" && !EMPLOYEE_KEYS.includes(key as EmployeeScenarioKey)) {
    return null;
  }
  if (context.actorType === "employer" && !EMPLOYER_KEYS.includes(key as EmployerScenarioKey)) {
    return null;
  }
  return getInjectorForKey(key);
}

/**
 * Register an injector for a scenario key. Use when wiring up real injectors.
 */
export function registerInjector(key: ScenarioKey, injector: ScenarioInjector): void {
  injectorMap[key] = injector;
}
