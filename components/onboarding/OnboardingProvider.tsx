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

type MeUser = { __impersonated?: boolean; role?: string };

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/status")
      .then((r) => r.json())
      .then((data: OnboardingStatus) => {
        setStatus(data);
        setShowOverlay(Boolean(data.showOnboarding && data.steps?.length));
      })
      .catch(() => setStatus({ showOnboarding: false }));
  }, []);

  useEffect(() => {
    if (!showOverlay) return;
    fetch("/api/user/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { user?: MeUser } | null) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, [showOverlay]);

  const completeOnboarding = () => {
    if (user?.__impersonated) return;
    setShowOverlay(false);
    fetch("/api/onboarding/complete", { method: "POST" }).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
  };

  const steps = status?.steps ?? [];
  // Hard admin bypass: do not show onboarding overlay for admin/superadmin (or any non-user role).
  const visible =
    showOverlay &&
    steps.length > 0 &&
    (user == null || user.role === "user");

  return (
    <>
      {children}
      {visible && (
        <OnboardingOverlay
          steps={steps}
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
          disableComplete={user?.__impersonated}
        />
      )}
    </>
  );
}
