"use client";

import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";

export function AdminBetaGate({ children }: { children: React.ReactNode }) {
  const { enabled } = useFeatureFlag("beta_access");
  if (!enabled) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Beta access is currently restricted.
      </div>
    );
  }
  return <>{children}</>;
}
