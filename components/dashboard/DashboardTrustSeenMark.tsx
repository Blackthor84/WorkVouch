"use client";

import { useEffect } from "react";
import { ONBOARDING_TRUST_REVIEWED_KEY } from "@/lib/onboarding/guidedOnboarding";

/**
 * Marks that the user has seen the dashboard trust header (first-win / checklist).
 * Renders nothing; runs once on mount.
 */
export function DashboardTrustSeenMark() {
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_TRUST_REVIEWED_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
