"use client";

import { Check } from "lucide-react";
import type { PanelWorkflowStep } from "@/lib/integrations/greenhouse/panel/types";
import { ghPanel } from "./panel-theme";

interface WorkflowStatusProps {
  steps: PanelWorkflowStep[];
}

export function WorkflowStatus({ steps }: WorkflowStatusProps) {
  return (
    <section
      className={`${ghPanel.card} ${ghPanel.cardPadding}`}
      aria-labelledby="wv-workflow-heading"
    >
      <h2 id="wv-workflow-heading" className={ghPanel.heading}>
        Workflow Status
      </h2>
      <ol className="mt-3 space-y-2" role="list" aria-label="Candidate workflow progress">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                step.status === "complete"
                  ? "bg-[#047957] text-white"
                  : step.status === "active"
                    ? "border-2 border-[#047957] bg-white"
                    : step.status === "skipped"
                      ? "bg-[#eef1ef] text-[#8a9690]"
                      : "border border-[#d5dbd8] bg-white"
              }`}
              aria-hidden="true"
            >
              {step.status === "complete" && <Check className="h-3 w-3" />}
            </span>
            <span
              className={
                step.status === "active"
                  ? "font-semibold text-[#15372c]"
                  : step.status === "complete"
                    ? "text-[#5c6c66]"
                    : "text-[#8a9690]"
              }
            >
              {step.label}
              <span className="sr-only">
                {step.status === "complete"
                  ? ", completed"
                  : step.status === "active"
                    ? ", in progress"
                    : ", pending"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
