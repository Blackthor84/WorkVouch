"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export const ELITE_DEMO_STORAGE_KEY = "workvouch_elite_demo_state";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export type PreviewState = {
  role?: string;
  subscription?: string;
  featureFlags?: string[];
  fakeUserName?: string;
  fakeCompanyName?: string;
  simulateAds?: boolean;
  // Elite demo extensions
  demoActive?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  simulateExpired?: boolean;
  seatsUsed?: number;
  seatsLimit?: number;
  reportsUsed?: number;
  reportLimit?: number;
  searchesUsed?: number;
  searchLimit?: number;
  fakeMRR?: number;
  fakeRevenue?: number;
  fakeChurnRate?: number;
  advertiserImpressions?: number;
  advertiserClicks?: number;
  advertiserSpend?: number;
  advertiserCTR?: number;
  advertiserROI?: number;
  trialEndsAt?: string; // ISO date for trialing urgency
};

export function defaultEliteState(): Partial<PreviewState> {
  return {
    demoActive: true,
    subscriptionStatus: "active",
    simulateExpired: false,
    seatsUsed: 3,
    seatsLimit: 10,
    reportsUsed: 5,
    reportLimit: 20,
    searchesUsed: 12,
    searchLimit: 25,
    fakeMRR: 2400,
    fakeRevenue: 28800,
    fakeChurnRate: 2.5,
    advertiserImpressions: 50000,
    advertiserClicks: 1200,
    advertiserSpend: 800,
    advertiserCTR: 2.4,
    advertiserROI: 3.2,
    trialEndsAt: undefined,
  };
}

export function loadEliteStateFromStorage(): Partial<PreviewState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ELITE_DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PreviewState>;
    return { ...defaultEliteState(), ...parsed };
  } catch {
    return null;
  }
}

export function saveEliteStateToStorage(state: Partial<PreviewState> | null) {
  if (typeof window === "undefined") return;
  try {
    if (!state || !state.demoActive) {
      localStorage.removeItem(ELITE_DEMO_STORAGE_KEY);
      return;
    }
    localStorage.setItem(ELITE_DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const PreviewContext = createContext<{
  preview: PreviewState | null;
  setPreview: (state: PreviewState | null | ((prev: PreviewState | null) => PreviewState | null)) => void;
}>({
  preview: null,
  setPreview: () => {},
});

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreviewState] = useState<PreviewState | null>(null);
  const searchParams = useSearchParams();

  const setPreview = useCallback((value: PreviewState | null | ((prev: PreviewState | null) => PreviewState | null)) => {
    setPreviewState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      saveEliteStateToStorage(next);
      return next;
    });
  }, []);

  // Existing simulate= pro_employer / investor
  useEffect(() => {
    const simulate = searchParams.get("simulate");
    if (simulate === "pro_employer") {
      setPreviewState((prev) => {
        if (prev?.demoActive) return prev;
        return {
          role: "employer",
          subscription: "pro",
          featureFlags: ["advanced_analytics", "ads_system", "rehire_probability_index"],
          fakeUserName: "Michael Grant",
          fakeCompanyName: "Sentinel Security Group",
          simulateAds: true,
        };
      });
      return;
    }
    if (simulate === "investor") {
      setPreviewState((prev) => {
        if (prev?.demoActive) return prev;
        return {
          role: "employer",
          subscription: "pro",
          featureFlags: [
            "advanced_analytics",
            "ads_system",
            "rehire_probability_index",
            "team_compatibility_scoring",
            "workforce_risk_indicator",
          ],
          fakeUserName: "Ava Thompson",
          fakeCompanyName: "Global Talent Systems",
          simulateAds: true,
        };
      });
      return;
    }
  }, [searchParams]);

  // Elite demo activation is handled by DemoModeActivator (inside SessionProvider) so we have access to session.

  return (
    <PreviewContext.Provider value={{ preview, setPreview }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
