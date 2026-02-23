/**
 * Employee scenario injectors (employee_01–employee_05). In-memory overrides only; never persisted.
 */

import type { ImpersonationSimulationContext } from "../context";
import type { ScenarioInjector } from "../scenarioResolver";

/** In-memory overlay: spread over base. Only override keys that the scenario changes. */
function overlay(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  return { ...base, ...overrides };
}

/**
 * employee_01 — New account: minimal profile, no trust score, onboarding incomplete.
 */
export const employee_01_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employee_01",
    trustScore: 0,
    onboardingCompleted: false,
    employmentRecordsCount: 0,
    referencesCount: 0,
    profileStrength: 10,
  });
};

/**
 * employee_02 — Early stage: one job, unverified, low trust.
 */
export const employee_02_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employee_02",
    trustScore: 28,
    onboardingCompleted: true,
    employmentRecordsCount: 1,
    referencesCount: 0,
    profileStrength: 35,
  });
};

/**
 * employee_03 — Building trust: multiple jobs, some references, medium trust.
 */
export const employee_03_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employee_03",
    trustScore: 62,
    onboardingCompleted: true,
    employmentRecordsCount: 3,
    referencesCount: 2,
    profileStrength: 70,
  });
};

/**
 * employee_04 — High trust: verified references, strong profile, dispute-free.
 */
export const employee_04_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employee_04",
    trustScore: 88,
    onboardingCompleted: true,
    employmentRecordsCount: 5,
    referencesCount: 4,
    profileStrength: 92,
    activeDisputeCount: 0,
  });
};

/**
 * employee_05 — Edge case: dispute under review, trust score pending.
 */
export const employee_05_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employee_05",
    trustScore: 45,
    onboardingCompleted: true,
    employmentRecordsCount: 2,
    referencesCount: 1,
    profileStrength: 55,
    activeDisputeCount: 1,
    trustScoreUnderReview: true,
  });
};

export const EMPLOYEE_INJECTORS_01_05 = [
  { key: "employee_01" as const, injector: employee_01_injector },
  { key: "employee_02" as const, injector: employee_02_injector },
  { key: "employee_03" as const, injector: employee_03_injector },
  { key: "employee_04" as const, injector: employee_04_injector },
  { key: "employee_05" as const, injector: employee_05_injector },
];
