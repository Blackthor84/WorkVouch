"use client";

import type { DemoStep } from "@/lib/demo/demoFlows";

type DemoOverlayProps = {
  step: DemoStep | null;
};

/** Fixed overlay showing current demo step title and description (Salesforce-style). */
export function DemoOverlay({ step }: DemoOverlayProps) {
  if (!step) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-96 rounded-xl bg-black p-4 text-white shadow-lg"
      role="status"
      aria-live="polite"
    >
      <h3 className="font-bold">{step.title}</h3>
      <p className="text-sm opacity-90">{step.description}</p>
    </div>
  );
}
