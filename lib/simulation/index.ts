/**
 * WorkVouch Simulation Engine – public API.
 * Reusable across client + server. No React hooks, no database access.
 */

export type { PlanTier, SimulationInputs, SimulationOutput } from "./types";
export type { PlanLimits } from "./calculations";
export {
  getPlanLimits,
  calculateRehireProbability,
  calculateTeamCompatibility,
  calculateWorkforceRisk,
  calculateAdROI,
} from "./calculations";
export { runSimulation } from "./engine";
export { getMonthlyPrice } from "./pricing";
