/**
 * Silent employer blacklist: detect bad employers without tipping them off.
 * Shadow detection only; no enforcement until admin enables.
 * Admin UI: badge "Monitored — No Action Taken".
 * No DB writes for demo; in-memory / shadow only.
 */

export type EmployerSignal = {
  type: string;
  [key: string]: unknown;
};

export type EmployerShadowResult = {
  shadowFlagged: boolean;
  enforcement: boolean;
};

export function detectEmployerAbuse(
  employerSignals: EmployerSignal[] = []
): EmployerShadowResult {
  const severity = employerSignals.filter(
    (s) => s.type === "overreach" || s.type === "retaliation"
  ).length;

  return {
    shadowFlagged: severity >= 3,
    enforcement: false, // silent
  };
}
