"use client";

import { useState, useCallback } from "react";
import { startDemoFlow, stopDemoFlow } from "@/lib/demo/demoController";
import { startAutoRotate, stopAutoRotate } from "@/lib/demo/autoRotate";
import type { DemoStep, DemoFlowKey } from "@/lib/demo/demoFlows";
import { DemoOverlay } from "./DemoOverlay";

const DEFAULT_INTERVAL_MS = 10000;

async function applyScenarioToServer(actorType: "employee" | "employer", scenario: string) {
  await fetch("/api/admin/impersonate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actorType, scenario }),
  });
}

export function DemoControls() {
  const [currentStep, setCurrentStep] = useState<DemoStep | null>(null);
  const [autoRotating, setAutoRotating] = useState(false);
  const [flowKey, setFlowKey] = useState<DemoFlowKey>("employer_buyer");

  const applyStep = useCallback(async (step: DemoStep) => {
    await applyScenarioToServer(step.actorType, step.scenario);
    setCurrentStep(step);
  }, []);

  const handleStartFlow = useCallback(() => {
    stopAutoRotate();
    setAutoRotating(false);
    setCurrentStep(null);
    startDemoFlow(flowKey, (step) => {
      applyScenarioToServer(step.actorType, step.scenario);
      setCurrentStep(step);
    });
  }, [flowKey]);

  const handleStopFlow = useCallback(() => {
    stopDemoFlow();
    setCurrentStep(null);
  }, []);

  const handleStartAutoRotate = useCallback(() => {
    stopDemoFlow();
    setCurrentStep(null);
    startAutoRotate(async (item) => {
      await applyScenarioToServer(item.actorType, item.scenario);
      setCurrentStep({
        title: item.scenario.replace(/_/g, " "),
        description: "Auto-rotating demo",
        actorType: item.actorType,
        scenario: item.scenario,
      });
    }, DEFAULT_INTERVAL_MS);
    setAutoRotating(true);
  }, []);

  const handleStopAutoRotate = useCallback(() => {
    stopAutoRotate();
    setAutoRotating(false);
    setCurrentStep(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={flowKey}
          onChange={(e) => setFlowKey(e.target.value as DemoFlowKey)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        >
          <option value="employer_buyer">Employer buyer</option>
          <option value="employee_trust">Employee trust</option>
          <option value="enterprise_compliance">Enterprise compliance</option>
        </select>
        <button
          type="button"
          onClick={handleStartFlow}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Start flow
        </button>
        <button
          type="button"
          onClick={handleStopFlow}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Stop flow
        </button>
        <span className="text-slate-500">|</span>
        <button
          type="button"
          onClick={handleStartAutoRotate}
          disabled={autoRotating}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50"
        >
          Start Auto Demo
        </button>
        <button
          type="button"
          onClick={handleStopAutoRotate}
          disabled={!autoRotating}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50"
        >
          Stop Auto Demo
        </button>
      </div>
      <DemoOverlay step={currentStep} />
    </div>
  );
}
