/**
 * Feature gating: Enterprise vs non-enterprise.
 * Superadmin and founder bypass all plan restrictions (full lab access).
 * Non-enterprise sees value (outcomes, previews) without full control.
 */

export type LabAccessContext = { role: string | null; isFounder?: boolean };

export function isEnterprise(role: string | null, isFounder?: boolean): boolean {
  if (role === "superadmin" || role === "enterprise") return true;
  if (isFounder === true) return true;
  return false;
}

/** Multiverse: Prime view for all; Fork/Destroy/Merge enterprise-only (or founder) */
export function canFork(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}
export function canMerge(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}
export function canDestroyUniverse(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}

/** God Mode / Reality actions: non-enterprise view outcome, enterprise/founder can trigger */
export function canTriggerGodMode(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}

/** Intent & Human Error: non-enterprise read-only */
export function canEditIntent(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}
export function canUseErrorModeling(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}

/** Adversarial: presets only for non-enterprise; custom/tuning for enterprise/founder */
export function canUseCustomAdversarial(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}

/** Trust Debt & Fragility: value visible for all; trigger/tuning enterprise/founder */
export function canTriggerDebt(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}
export function canTuneFragility(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}

/** Population: single full; small group limited for non-enterprise; bulk enterprise/founder */
export function maxPopulationSize(role: string | null, isFounder?: boolean): number {
  return isEnterprise(role, isFounder) ? Infinity : 5;
}
export function canBulkPopulation(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}
export function canFullGroupHiring(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}

/** Audit: read-only for non-enterprise */
export function canFullAuditExport(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}
export function canUseRegulatorLens(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}

/** ROI Calculator: non-enterprise read-only; enterprise/founder can adjust assumptions */
export function canEditROIAssumptions(role: string | null, isFounder?: boolean): boolean {
  return isEnterprise(role, isFounder);
}
