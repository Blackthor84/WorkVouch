/**
 * Feature gating: Enterprise vs non-enterprise.
 * Non-enterprise sees value (outcomes, previews) without full control.
 * Use progressive disclosure and soft locks, not hard walls.
 */

export function isEnterprise(role: string | null): boolean {
  return role === "superadmin" || role === "enterprise";
}

/** Multiverse: Prime view for all; Fork/Destroy/Merge enterprise-only */
export function canFork(role: string | null): boolean {
  return isEnterprise(role);
}
export function canMerge(role: string | null): boolean {
  return isEnterprise(role);
}
export function canDestroyUniverse(role: string | null): boolean {
  return isEnterprise(role);
}

/** God Mode / Reality actions: non-enterprise view outcome, enterprise can trigger */
export function canTriggerGodMode(role: string | null): boolean {
  return isEnterprise(role);
}

/** Intent & Human Error: non-enterprise read-only */
export function canEditIntent(role: string | null): boolean {
  return isEnterprise(role);
}
export function canUseErrorModeling(role: string | null): boolean {
  return isEnterprise(role);
}

/** Adversarial: presets only for non-enterprise; custom/tuning for enterprise */
export function canUseCustomAdversarial(role: string | null): boolean {
  return isEnterprise(role);
}

/** Trust Debt & Fragility: value visible for all; trigger/tuning enterprise */
export function canTriggerDebt(role: string | null): boolean {
  return isEnterprise(role);
}
export function canTuneFragility(role: string | null): boolean {
  return isEnterprise(role);
}

/** Population: single full; small group limited for non-enterprise; bulk enterprise */
export function maxPopulationSize(role: string | null): number {
  return isEnterprise(role) ? Infinity : 5;
}
export function canBulkPopulation(role: string | null): boolean {
  return isEnterprise(role);
}
export function canFullGroupHiring(role: string | null): boolean {
  return isEnterprise(role);
}

/** Audit: read-only for non-enterprise */
export function canFullAuditExport(role: string | null): boolean {
  return isEnterprise(role);
}
export function canUseRegulatorLens(role: string | null): boolean {
  return isEnterprise(role);
}

/** ROI Calculator: non-enterprise read-only; enterprise can adjust assumptions */
export function canEditROIAssumptions(role: string | null): boolean {
  return isEnterprise(role);
}
