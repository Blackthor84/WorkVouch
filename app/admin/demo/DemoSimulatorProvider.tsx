"use client";

import { ReactNode } from "react";

/**
 * Wraps demo pages so they share the same simulator context (PreviewProvider from root).
 * No duplicate context - just a named boundary for demo routes.
 */
export function DemoSimulatorProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
