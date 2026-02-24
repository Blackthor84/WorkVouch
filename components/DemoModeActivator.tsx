"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";
import { isEliteDemoEnabled } from "@/lib/demo-mode";
import {
  usePreview,
  defaultEliteState,
  loadEliteStateFromStorage,
  saveEliteStateToStorage,
  type PreviewState,
} from "@/lib/preview-context";

/**
 * Presentational: shows "Demo mode active" when demo is true.
 * Does NOT use useSearchParams — receive `demo` from a parent client wrapped in Suspense.
 */
export function DemoModeActivator({ demo }: { demo: boolean }) {
  if (!demo) return null;
  return <div>Demo mode active</div>;
}

/**
 * Page/layout-level client: reads URL params and session, runs elite demo logic, passes demo to DemoModeActivator.
 * Must be rendered inside <Suspense> (useSearchParams can suspend).
 */
export function DemoModeActivatorWithParams() {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSupabaseSession();
  const { setPreview } = usePreview();

  useEffect(() => {
    if (sessionStatus === "loading") return;

    const demoParam = searchParams.get("demo");
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    const enabled = isEliteDemoEnabled(searchParams, userRole);

    if (demoParam === "elite" && enabled) {
      const stored = loadEliteStateFromStorage();
      const base = { ...defaultEliteState(), ...stored, demoActive: true } as PreviewState;
      if (!base.featureFlags?.length) {
        base.featureFlags = ["elite_simulation", "ads_system", "advanced_analytics"];
      }
      setPreview((prev) => (prev?.demoActive ? prev : base));
      return;
    }

    if (demoParam !== "elite" && !enabled) {
      setPreview((prev) => {
        if (prev?.demoActive) {
          saveEliteStateToStorage(null);
          return null;
        }
        return prev;
      });
    }
  }, [searchParams, session?.user?.role, sessionStatus, setPreview]);

  const demo =
    searchParams.get("demo") === "1" ||
    (searchParams.get("demo") === "elite" && isEliteDemoEnabled(searchParams, (session?.user as { role?: string } | undefined)?.role));

  return <DemoModeActivator demo={demo} />;
}
