"use client";

import Link from "next/link";

/**
 * Admin pages must never crash silently. Error boundary shows clear message;
 * reference audit IDs when applicable. Deny access by default.
 */
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-8">
      <div className="max-w-md rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-lg font-bold text-red-900 mb-2">Admin panel error</h2>
        <p className="text-sm text-red-800 mb-4">
          Something went wrong. This has been logged. Do not retry destructive actions without checking audit logs.
        </p>
        <pre className="text-left text-xs bg-white border border-red-200 rounded p-3 mb-4 overflow-auto max-h-32">
          {error.message}
        </pre>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/admin/audit-logs"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Audit logs
          </Link>
        </div>
      </div>
    </div>
  );
}
