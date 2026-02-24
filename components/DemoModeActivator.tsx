"use client";

import { useEffect, useState } from "react";
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
 * Pure presentational: shows "Demo mode active" when enabled.
 * Does NOT use useSearchParams — receive `enabled` from a page-level reader (e.g. DemoModeFromParams) inside Suspense.
 */
export function DemoModeActivator({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return <div>Demo mode active</div>;
}

/**
 * Page-level param reader: reads URL in effect (no useSearchParams), passes to pure DemoModeActivator.
 */
export function DemoModeFromParams() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.get("demo") === "1");
  }, []);
  if (!enabled) return null;
  return <DemoModeActivator enabled={enabled} />;
}

/**
 * Page/layout-level client: reads URL in effect (no useSearchParams), runs elite demo logic, passes to DemoModeActivator.
 * Hooks always run; conditional JSX only.
 */
export function DemoModeActivatorWithParams() {
  const [enabled, setEnabled] = useState(false);
  const { data: session, status: sessionStatus } = useSupabaseSession();
  const { setPreview } = usePreview();

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const demoParam = params.get("demo");
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    const eliteEnabled = isEliteDemoEnabled(params, userRole);

    if (sessionStatus === "loading") {
      setEnabled(demoParam === "1");
      return;
    }

    if (demoParam === "elite" && eliteEnabled) {
      const stored = loadEliteStateFromStorage();
      const base = { ...defaultEliteState(), ...stored, demoActive: true } as PreviewState;
      if (!base.featureFlags?.length) {
        base.featureFlags = ["elite_simulation", "ads_system", "advanced_analytics"];
      }
      setPreview((prev) => (prev?.demoActive ? prev : base));
      setEnabled(true);
      return;
    }

    if (demoParam !== "elite" && !eliteEnabled) {
      setPreview((prev) => {
        if (prev?.demoActive) {
          saveEliteStateToStorage(null);
          return null;
        }
        return prev;
      });
    }

    setEnabled(demoParam === "1" || (demoParam === "elite" && eliteEnabled));
  }, [session?.user?.role, sessionStatus, setPreview]);

  if (!enabled) return null;
  return <DemoModeActivator enabled={enabled} />;
}
