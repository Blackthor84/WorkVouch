"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TourStepConfig } from "./TourStep";

interface TourOverlayProps {
  steps: TourStepConfig[];
  onClose?: () => void;
  endCtaText?: string;
  endCtaHref?: string;
}

export function TourOverlay({
  steps,
  onClose,
  endCtaText = "Create Account to Unlock Full Access",
  endCtaHref = "/auth/signup",
}: TourOverlayProps) {
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
      onClose?.();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (isFirst) return;
    setStepIndex((i) => i - 1);
  };

  const handleSkip = () => {
    onClose?.();
  };

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-modal
      role="dialog"
      aria-label="Product tour"
    >
      {/* Dimmed background with cutout */}
      <div className="absolute inset-0 pointer-events-auto">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-spotlight-mask">
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
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-spotlight-mask)" />
        </svg>
      </div>

      {/* Spotlight ring around target */}
      {targetRect && (
        <div
          className="absolute pointer-events-none rounded-xl border-2 border-blue-500 dark:border-blue-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
          style={{
            left: targetRect.x - 8,
            top: targetRect.y - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      )}

      {/* Tooltip card — fixed at bottom for visibility */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-md px-4 z-[10000]">
        <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-xl border border-grey-background dark:border-[#374151] p-6 animate-in fade-in duration-300">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
            Step {stepIndex + 1} of {steps.length}
          </div>
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-grey-medium dark:text-gray-400 mb-6">
            {step.description}
          </p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-grey-medium dark:text-gray-400">
                Skip tour
              </Button>
            </div>
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="secondary" size="sm" onClick={handleBack}>
                  Back
                </Button>
              )}
              {isLast ? (
                <Link href={endCtaHref}>
                  <Button size="sm" onClick={handleNext}>
                    {endCtaText}
                  </Button>
                </Link>
              ) : (
                <Button size="sm" onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
