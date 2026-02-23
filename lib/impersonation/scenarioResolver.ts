import type { ImpersonationContext } from "@/types/impersonation";
import * as employee from "./scenarios/employee";
import * as employer from "./scenarios/employer";

export function applyScenario<T>(
  baseData: T,
  context?: ImpersonationContext
): T {
  if (!context?.impersonating || !context.scenario) return baseData;

  const map = {
    ...employee,
    ...employer,
  };

  const injector = map[context.scenario as keyof typeof map];
  if (!injector) return baseData;

  return injector(baseData);
}
