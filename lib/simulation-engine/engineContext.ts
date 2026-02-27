import type { Employer, Policy } from "./domain";

export interface EngineContext {
  employer?: Employer;
  policy?: Policy;
  thresholdOverride?: number;
}

export function getThreshold(ctx: EngineContext | undefined): number {
  return ctx?.thresholdOverride ?? ctx?.policy?.threshold ?? 60;
}

export function getDecayRate(ctx: EngineContext | undefined): number {
  return ctx?.policy?.decayRate ?? 1.0;
}

export function getSupervisorWeight(ctx: EngineContext | undefined): number {
  return ctx?.policy?.supervisorWeight ?? 1.5;
}
