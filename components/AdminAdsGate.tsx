"use client";

import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";

export function AdminAdsGate({ children }: { children: React.ReactNode }) {
  const { enabled, loading } = useFeatureFlag("ads_system");
  if (loading) return null;
  if (!enabled) return null;
  return <>{children}</>;
}
