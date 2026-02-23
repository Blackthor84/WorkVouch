export type AbuseSignal = {
  userId: string;
  signal: string;
  severity: "low" | "medium" | "high";
  timestamp: number;
};

export function aggregateSignals(signals: AbuseSignal[]): Record<string, number> {
  return signals.reduce<Record<string, number>>((acc, s) => {
    acc[s.signal] = (acc[s.signal] ?? 0) + 1;
    return acc;
  }, {});
}
