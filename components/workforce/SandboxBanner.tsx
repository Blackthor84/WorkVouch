"use client";

import { getAppMode } from "@/lib/app-mode";

export function SandboxBanner() {
  const env = getAppMode();
  if (env !== "sandbox") return null;
  return (
    <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium">
      SANDBOX MODE – DATA IS ISOLATED. Everything behaves identically to production.
    </div>
  );
}
