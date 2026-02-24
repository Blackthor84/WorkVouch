"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth/useUser";

export interface OnboardingStepConfig {
  id: string;
  targetId: string;
  title: string;
  description: string;
}

export interface OnboardingOverlayProps {
  steps: OnboardingStepConfig[];
  onComplete: () => void;
  onSkip?: () => void;
  disableComplete?: boolean;
}

export function OnboardingOverlay({
  steps,
  onComplete,
  onSkip,
  disableComplete,
}: OnboardingOverlayProps) {
  const { user } = useUser();

  // 🔒 HARD ADMIN BYPASS — NEVER REMOVE
  if (!user || user.role === "admin" || user.role === "superadmin") {
    return null;
  }

  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const el = document.getElementById(step.targetId);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    updateTargetRect();
    const resize = () => updateTargetRect();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [updateTargetRect]);

  useEffect(() => {
    if (step) {
      const el = document.getElementById(step.targetId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step]);

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (isFirst) return;
    setStepIndex((i) => i - 1);
  };

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-modal
      role="dialog"
      aria-label="Onboarding walkthrough"
    >
      <div className="absolute inset-0 pointer-events-auto">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="onboarding-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.x - 8}
                  y={targetRect.y - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#onboarding-spotlight-mask)" />
        </svg>
      </div>

      {targetRect && (
        <div
          className="absolute pointer-events-none rounded-xl border-2 border-emerald-500 dark:border-emerald-400"
          style={{
            left: targetRect.x - 8,
            top: targetRect.y - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      )}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-md px-4 z-[10000]">
        <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-xl border border-grey-background dark:border-[#374151] p-6 animate-in fade-in duration-300">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
            Step {stepIndex + 1} of {steps.length}
          </div>
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-grey-medium dark:text-gray-400 mb-6">
            {step.description}
          </p>
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={onSkip} disabled={disableComplete} className="text-grey-medium dark:text-gray-400">
              Skip
            </Button>
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="secondary" size="sm" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext} disabled={disableComplete}>
                {isLast ? "Done" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingOverlay;
