/**
 * Shadow mode: detect abuse without punishing yet.
 * recordShadowSignal() records a signal with enforced: false until admin enables enforcement.
 * Admin-only dashboard toggle: "Enable enforcement".
 */

export type ShadowSignal = {
  userId: string;
  signal: string;
  severity: "low" | "medium" | "high";
  timestamp: number;
  enforced?: boolean;
};

const shadowSignals: ShadowSignal[] = [];
let shadowEnforcementEnabled = false;

/** Record a signal in shadow mode (not enforced until admin enables). */
export function recordShadowSignal(signal: Omit<ShadowSignal, "enforced">): ShadowSignal {
  const entry: ShadowSignal = {
    ...signal,
    enforced: false,
  };
  shadowSignals.push(entry);
  return entry;
}

/** Get all shadow signals (admin-only). */
export function getShadowSignals(): ShadowSignal[] {
  return shadowSignals.map((s) => ({
    ...s,
    enforced: shadowEnforcementEnabled ? true : s.enforced,
  }));
}

/** Whether enforcement is enabled (admin toggle). */
export function isShadowEnforcementEnabled(): boolean {
  return shadowEnforcementEnabled;
}

/** Set enforcement (admin-only). When true, signals are treated as enforced. */
export function setShadowEnforcement(enabled: boolean): void {
  shadowEnforcementEnabled = enabled;
}
