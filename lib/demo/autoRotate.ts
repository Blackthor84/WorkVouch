export const autoRotateScenarios = [
  { actorType: "employee" as const, scenario: "employee_perfect_candidate" },
  { actorType: "employee" as const, scenario: "employee_conflicting_dates" },
  { actorType: "employer" as const, scenario: "employer_fast_hiring_manager" },
  { actorType: "employer" as const, scenario: "employer_conflicting_references" },
  { actorType: "employer" as const, scenario: "employer_fraud_detection_view" },
];

type ApplyScenarioFn = (item: { actorType: "employee" | "employer"; scenario: string }) => void;

let rotateInterval: ReturnType<typeof setInterval> | null = null;
let rotateIndex = 0;

export function startAutoRotate(
  applyScenario: ApplyScenarioFn,
  intervalMs = 10000
): ReturnType<typeof setInterval> {
  if (rotateInterval) clearInterval(rotateInterval);
  rotateIndex = 0;

  rotateInterval = setInterval(() => {
    const next = autoRotateScenarios[rotateIndex];
    applyScenario(next);
    rotateIndex = (rotateIndex + 1) % autoRotateScenarios.length;
  }, intervalMs);

  return rotateInterval;
}

export function stopAutoRotate(): void {
  if (rotateInterval) {
    clearInterval(rotateInterval);
    rotateInterval = null;
  }
}
