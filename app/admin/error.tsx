"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log in dev; avoid noisy logs in prod
    if (process.env.NODE_ENV === "development") {
      console.error("[admin error boundary]", error?.message ?? error);
    }
  }, [error]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-slate-600 mb-4 max-w-md">
        The admin panel couldn&apos;t load. You can try again or go back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
