import { demoFlows, type DemoFlowKey, type DemoStep } from "./demoFlows";

let demoTimer: ReturnType<typeof setTimeout> | null = null;

export function startDemoFlow(
  flowKey: DemoFlowKey,
  applyStep: (step: DemoStep) => void
): void {
  const steps = demoFlows[flowKey];
  if (!steps?.length) return;

  let index = 0;

  function next() {
    const step = steps[index] as DemoStep;
    applyStep(step);

    index++;
    if (index < steps.length) {
      demoTimer = setTimeout(next, step.durationMs ?? 7000);
    } else {
      demoTimer = null;
    }
  }

  if (demoTimer) clearTimeout(demoTimer);
  demoTimer = null;
  next();
}

export function stopDemoFlow(): void {
  if (demoTimer) {
    clearTimeout(demoTimer);
    demoTimer = null;
  }
}
