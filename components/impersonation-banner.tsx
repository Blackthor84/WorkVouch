"use client";

import { useImpersonation } from "@/components/impersonation/ImpersonationContext";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const { isImpersonating, effectiveUser, loading, exitImpersonation, impersonation } = useImpersonation();

  if (loading) return null;

  return (
    <>
      {impersonation?.impersonating && (
        <div className="bg-red-600 text-white text-center p-2">
          IMPERSONATION MODE — SCENARIO ACTIVE
        </div>
      )}
      {isImpersonating && (
        <div
          className="sticky top-0 z-[60] flex w-full items-center justify-center gap-4 border-b border-amber-200 bg-amber-500 px-4 py-2.5 text-sm font-medium text-amber-950 shadow-md"
          role="alert"
          aria-live="polite"
        >
          <span>
            Viewing as <strong>
              {effectiveUser?.full_name?.trim() ||
                effectiveUser?.email ||
                effectiveUser?.id ||
                "another user"}
            </strong>
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
      )}
    </>
  );
}
