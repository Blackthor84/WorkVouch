"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const DISCLAIMER_MESSAGE =
  "Before you search candidates or view profiles, you must accept our Employer Agreement. It explains how you may use WorkVouch reputation data and your obligations under employment and fair-chance hiring laws.";

export interface EmployerLegalDisclaimerModalProps {
  open: boolean;
  onAccept: () => Promise<void>;
  accepting?: boolean;
}

/**
 * Blocking modal for employer legal disclaimer. Not dismissible without accepting.
 * No overlay click close, no escape key close.
 */
export function EmployerLegalDisclaimerModal({
  open,
  onAccept,
  accepting = false,
}: EmployerLegalDisclaimerModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employer-disclaimer-title"
    >
      {/* Backdrop - no onClick so modal cannot be dismissed by clicking outside */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#1A1F2B]">
        <h2
          id="employer-disclaimer-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          Employer Agreement required
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {DISCLAIMER_MESSAGE}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          By clicking Accept, you agree to the{" "}
          <a
            href="/legal/employer-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Employer Agreement
          </a>
          .
        </p>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => onAccept()}
            disabled={accepting}
            className="min-w-[120px]"
          >
            {accepting ? "Accepting…" : "Accept"}
          </Button>
        </div>
      </div>
    </div>
  );
}
