"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { WvButton } from "@/components/wv";

type ProductTourNavProps = {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  nextLabel?: string;
};

export function ProductTourNav({
  step,
  totalSteps,
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  nextLabel = "Next →",
}: ProductTourNavProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-wv-bg/90 backdrop-blur-xl"
      aria-label="Product tour navigation"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="hidden text-xs text-wv-subtle sm:block">
          Step {step + 1} of {totalSteps}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <WvButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={!canGoBack}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </WvButton>
          <WvButton
            type="button"
            size="sm"
            onClick={onNext}
            disabled={!canGoNext}
            className="gap-1"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </WvButton>
        </div>
      </div>
    </div>
  );
}
