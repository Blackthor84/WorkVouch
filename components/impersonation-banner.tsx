"use client";

import { useImpersonation } from "@/components/impersonation/ImpersonationContext";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const { isImpersonating, effectiveUser, loading, exitImpersonation } = useImpersonation();

  if (loading || !isImpersonating) return null;

  const displayName =
    effectiveUser?.full_name?.trim() ||
    effectiveUser?.email ||
    effectiveUser?.id ||
    "another user";

  return (
    <div
      className="sticky top-0 z-[60] flex w-full items-center justify-center gap-4 border-b border-amber-200 bg-amber-500 px-4 py-2.5 text-sm font-medium text-amber-950 shadow-md"
      role="alert"
      aria-live="polite"
    >
      <span>
        Viewing as <strong>{displayName}</strong>
      </span>
      <Button
        variant="outline"
        size="sm"
        className="border-amber-700 bg-amber-100 text-amber-900 hover:bg-amber-200"
        onClick={exitImpersonation}
      >
        Exit impersonation
      </Button>
    </div>
  );
}
