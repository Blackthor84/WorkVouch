"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { isEliteDemoEnabled } from "@/lib/demo-mode";
import {
  usePreview,
  defaultEliteState,
  loadEliteStateFromStorage,
  saveEliteStateToStorage,
  type PreviewState,
} from "@/lib/preview-context";

/**
 * Activates Elite Demo when URL has ?demo=elite and user is allowed (admin or public demo enabled).
 * Must render inside SessionProvider so useSession works.
 */
export function DemoModeActivator() {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const { preview, setPreview } = usePreview();

  useEffect(() => {
    if (sessionStatus === "loading") return;

    const demoParam = searchParams.get("demo");
    const userRole = session?.user?.role ?? session?.user?.roles?.[0];
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

    // Remove demo on refresh when secret URL is not present (production-safe)
    if (demoParam !== "elite" && !enabled) {
      setPreview((prev) => {
        if (prev?.demoActive) {
          saveEliteStateToStorage(null);
          return null;
        }
        return prev;
      });
    }
  }, [searchParams, session?.user?.role, session?.user?.roles, sessionStatus, setPreview]);

  return null;
}
