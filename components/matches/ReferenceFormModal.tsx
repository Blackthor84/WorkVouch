"use client";

import { useState } from "react";
import { XMarkIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

export function ReferenceFormModal({
  requesterName,
  onClose,
  onSubmit,
  loading,
}: {
  requesterName: string;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
  loading?: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    await onSubmit(rating, feedback.trim());
    onClose();
  }

  const displayRating = hoverRating || rating;

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
        aria-labelledby="leave-reference-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="leave-reference-title" className="text-xl font-semibold text-slate-900">
            Leave Reference
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
          Rate and recommend {requesterName}.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rating (1–5 stars)
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  {star <= displayRating ? (
                    <StarSolid className="h-8 w-8 text-amber-500" />
                  ) : (
                    <StarIcon className="h-8 w-8 text-slate-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="ref-feedback" className="block text-sm font-medium text-slate-700 mb-1">
              Feedback (optional)
            </label>
            <textarea
              id="ref-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="Share what it was like working with them..."
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
              disabled={loading || rating < 1}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit reference"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
