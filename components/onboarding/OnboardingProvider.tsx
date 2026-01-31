"use client";

import { useState, useEffect } from "react";
import { OnboardingOverlay } from "./OnboardingOverlay";
import type { OnboardingStepConfig } from "./OnboardingOverlay";

interface OnboardingStatus {
  showOnboarding: boolean;
  flow?: "employer" | "worker";
  steps?: OnboardingStepConfig[];
  completed?: boolean;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding/status")
      .then((r) => r.json())
      .then((data: OnboardingStatus) => {
        setStatus(data);
        setShowOverlay(Boolean(data.showOnboarding && data.steps?.length));
      })
      .catch(() => setStatus({ showOnboarding: false }));
  }, []);

  const completeOnboarding = () => {
    setShowOverlay(false);
    fetch("/api/onboarding/complete", { method: "POST" }).catch(() => {});
  };

  const steps = status?.steps ?? [];
  const visible = showOverlay && steps.length > 0;

  return (
    <>
      {children}
      {visible && (
        <OnboardingOverlay
          steps={steps}
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
        />
      )}
    </>
  );
}
