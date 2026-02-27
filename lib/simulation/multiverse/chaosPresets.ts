/**
 * Phase 7: One-click chaos presets. Reversible scripted events.
 */

import type { Universe, TrustSignal } from "./types";
import {
  createUniverse,
  applySignal,
  trustCollapse,
  fakeConsensusInjection,
  supervisorOverride,
  trustDebtCollectionEvent,
  createAuditEntry,
} from "./engine";

export type PresetName =
  | "glassdoor_attack"
  | "zombie_startup"
  | "perfect_fraud"
  | "mass_layoff_shock"
  | "ai_reference_flood";

export type PresetResult = {
  universes: Universe[];
  narrative: string;
  divergenceScore: number;
};

function auditId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Glassdoor Attack: flood negative peer signals */
export function runGlassdoorAttack(universe: Universe): PresetResult {
  let u = universe;
  const t = Date.now();
  const id = auditId();
  for (let i = 0; i < 5; i++) {
    u = applySignal(
      u,
      { id: `glassdoor-${t}-${i}`, source: "peer", weight: -0.5, timestamp: t - i * 86400000 },
      { action: "glassdoor_attack", auditId: id }
    );
  }
  return {
    universes: [u],
    narrative: "Glassdoor Attack: 5 negative peer signals injected. Trust pressure applied.",
    divergenceScore: 0.4,
  };
}

/** Zombie Startup: collapse threshold, minimal signals */
export function runZombieStartup(universe: Universe): PresetResult {
  const id = auditId();
  const u = trustCollapse(universe, id);
  const u2 = applySignal(
    u,
    { id: `zombie-${Date.now()}`, source: "supervisor", weight: 0.3, timestamp: Date.now() },
    { action: "zombie_startup", auditId: id }
  );
  return {
    universes: [u2],
    narrative: "Zombie Startup: Trust collapsed, single weak signal. High fragility.",
    divergenceScore: 0.7,
  };
}

/** Perfect Fraud: backdated strong signals + fake consensus */
export function runPerfectFraud(universe: Universe): PresetResult {
  const t = Date.now();
  const id = auditId();
  let u = applySignal(
    universe,
    { id: `fraud-sup-${t}`, source: "supervisor", weight: 2, timestamp: t - 86400000 * 60 },
    { action: "perfect_fraud", auditId: id }
  );
  u = fakeConsensusInjection(u, 2, id);
  return {
    universes: [u],
    narrative: "Perfect Fraud: Backdated supervisor + fake consensus. Trust inflated artificially.",
    divergenceScore: 0.8,
  };
}

/** Mass Layoff Shock: debt collection + collapse */
export function runMassLayoffShock(universe: Universe): PresetResult {
  const id = auditId();
  const u = trustDebtCollectionEvent(universe, id);
  const u2 = trustCollapse(u, auditId());
  return {
    universes: [u2],
    narrative: "Mass Layoff Shock: Trust debt collected, then full collapse. System shock.",
    divergenceScore: 0.9,
  };
}

/** AI Reference Flood: many synthetic peer signals */
export function runAIReferenceFlood(universe: Universe): PresetResult {
  const id = auditId();
  const u = fakeConsensusInjection(universe, 10, id);
  return {
    universes: [u],
    narrative: "AI Reference Flood: 10 synthetic peer signals. Consensus artificially high.",
    divergenceScore: 0.6,
  };
}

export const PRESETS: Record<PresetName, (u: Universe) => PresetResult> = {
  glassdoor_attack: runGlassdoorAttack,
  zombie_startup: runZombieStartup,
  perfect_fraud: runPerfectFraud,
  mass_layoff_shock: runMassLayoffShock,
  ai_reference_flood: runAIReferenceFlood,
};
