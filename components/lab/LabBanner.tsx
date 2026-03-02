"use client";

import { usePathname } from "next/navigation";

const LAB_PATH = "/admin/playground";

function isLabRoute(pathname: string): boolean {
  return pathname === LAB_PATH || pathname.startsWith(LAB_PATH + "/");
}

/**
 * Full-width Lab/Sandbox warning banner rendered ABOVE the main navbar when on
 * the Trust Lab route. Participates in normal layout flow (no fixed/absolute)
 * so the navbar sits below it and nothing overlaps.
 */
export function LabBanner() {
  const pathname = usePathname();
  if (!pathname || !isLabRoute(pathname)) return null;

  return (
    <div
      className="w-full flex items-center justify-center gap-2 border-b border-amber-500/50 bg-amber-500/15 px-4 py-2 text-amber-900 z-[60] shrink-0"
      role="alert"
      aria-live="polite"
    >
      <span className="font-semibold">Lab</span>
      <span className="opacity-90">— Safeguards bypassed. All changes local and reversible.</span>
    </div>
  );
}
