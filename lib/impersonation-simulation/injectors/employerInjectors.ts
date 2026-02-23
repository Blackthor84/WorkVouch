/**
 * Employer scenario injectors (employer_01–employer_05). In-memory overrides only; never persisted.
 * Based on lib/impersonation/scenarios/employer.ts semantics.
 */

import type { ImpersonationSimulationContext } from "../context";
import type { ScenarioInjector } from "../scenarioResolver";

function overlay(
  base: Record<string, unknown>,
  overrides: Record<string, unknown>
): Record<string, unknown> {
  return { ...base, ...overrides };
}

/**
 * employer_01 — Fast hiring manager: summary-only view.
 */
export const employer_01_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employer_01",
    viewMode: "summary_only",
  });
};

/**
 * employer_02 — Risk-averse HR: requires explanation for decisions.
 */
export const employer_02_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employer_02",
    requiresExplanation: true,
  });
};

/**
 * employer_03 — Enterprise auditor: audit mode enabled.
 */
export const employer_03_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employer_03",
    auditMode: true,
  });
};

/**
 * employer_04 — Suspicious employer: flag suspicious behavior.
 */
export const employer_04_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employer_04",
    flags: ["suspicious_behavior"],
  });
};

/**
 * employer_05 — Overreaching data request: flag overreach attempt.
 */
export const employer_05_injector: ScenarioInjector = (
  _context: ImpersonationSimulationContext,
  base: Record<string, unknown>
) => {
  return overlay(base, {
    _scenario: "employer_05",
    flags: ["overreach_attempt"],
  });
};

export const EMPLOYER_INJECTORS_01_05 = [
  { key: "employer_01" as const, injector: employer_01_injector },
  { key: "employer_02" as const, injector: employer_02_injector },
  { key: "employer_03" as const, injector: employer_03_injector },
  { key: "employer_04" as const, injector: employer_04_injector },
  { key: "employer_05" as const, injector: employer_05_injector },
];
