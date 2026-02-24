"use client";

import { createContext, useCallback, useContext, useState } from "react";

export const ELITE_DEMO_STORAGE_KEY = "workvouch_elite_demo_state";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

export type PreviewRole = "user" | "employer" | "admin";

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
  // Universal preview (admin-only effects)
  previewRole?: PreviewRole;
  previewPlanTier?: string | null;
  previewFeatures?: Record<string, boolean>;
  previewExpired?: boolean;
  previewSeatUsage?: number | null;
  previewReportsUsed?: number | null;
  previewSimulationData?: Record<string, unknown>;
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

export type PreviewContextType = {
  preview: PreviewState | null;
  setPreview: (
    state:
      | PreviewState
      | null
      | ((prev: PreviewState | null) => PreviewState | null)
  ) => void;
  setPreviewValue: <K extends keyof PreviewState>(
    key: K,
    value: PreviewState[K]
  ) => void;
};

const PreviewContext = createContext<PreviewContextType>({
  preview: null,
  setPreview: () => {},
  setPreviewValue: () => {},
});

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreviewState] = useState<PreviewState | null>(null);

  const setPreview = useCallback((value: PreviewState | null | ((prev: PreviewState | null) => PreviewState | null)) => {
    setPreviewState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      saveEliteStateToStorage(next);
      return next;
    });
  }, []);

  const setPreviewValue = useCallback(<K extends keyof PreviewState>(
    key: K,
    value: PreviewState[K]
  ) => {
    setPreviewState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      saveEliteStateToStorage(next);
      return next;
    });
  }, []);

  return (
    <PreviewContext.Provider value={{ preview, setPreview, setPreviewValue }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
