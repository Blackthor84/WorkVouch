/**
 * Guard for enterprise load simulation. Only allow when ENTERPRISE_SIMULATION_MODE=true.
 * Prevents accidental execution against production.
 */

export function isEnterpriseSimulationModeEnabled(): boolean {
  return process.env.ENTERPRISE_SIMULATION_MODE === "true";
}

export function requireEnterpriseSimulationMode(): void {
  if (!isEnterpriseSimulationModeEnabled()) {
    throw new Error(
      "Enterprise simulation is disabled. Set ENTERPRISE_SIMULATION_MODE=true to run simulation (never set in production)."
    );
  }
}
