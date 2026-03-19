"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function RequestReferenceModal({
  coworkerName,
  companyName,
  onClose,
  onSubmit,
  loading,
}: {
  coworkerName: string;
  companyName: string;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  loading?: boolean;
}) {
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(message.trim() || "");
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-reference-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="request-reference-title" className="text-xl font-semibold text-slate-900">
            Request Reference
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Ask {coworkerName} from {companyName} to vouch for you.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="ref-message" className="block text-sm font-medium text-slate-700 mb-1">
              Message (optional)
            </label>
            <textarea
              id="ref-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="e.g. We worked together at Acme — would you vouch for my skills?"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
