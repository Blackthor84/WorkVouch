"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function UpgradeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("workvouch-open-upgrade", handler);
    return () => window.removeEventListener("workvouch-open-upgrade", handler);
  }, []);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
        aria-hidden
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="upgrade-modal-title" className="text-xl font-semibold text-slate-900">
            Unlock Candidates
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 text-slate-600">
          Upgrade to view full verified work history, job details, and references for all candidates.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Stripe integration coming soon — subscription tiers and payment will be available here.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            Upgrade (coming soon)
          </button>
        </div>
      </div>
    </>
  );
}
