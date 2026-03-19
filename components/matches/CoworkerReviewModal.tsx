"use client";

import { useState } from "react";
import { XMarkIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

export type CoworkerReviewForm = {
  rating: number;
  reliability: number;
  teamwork: number;
  comment: string;
};

export function CoworkerReviewModal({
  coworkerName,
  onClose,
  onSubmit,
  loading,
}: {
  coworkerName: string;
  onClose: () => void;
  onSubmit: (data: CoworkerReviewForm) => Promise<void>;
  loading?: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [reliability, setReliability] = useState(0);
  const [teamwork, setTeamwork] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || reliability < 1 || teamwork < 1) return;
    await onSubmit({ rating, reliability, teamwork, comment: comment.trim() });
    onClose();
  }

  const displayRating = hoverRating || rating;

  function StarRow({
    value,
    onChange,
    label,
    useHover = false,
  }: {
    value: number;
    onChange: (n: number) => void;
    label: string;
    useHover?: boolean;
  }) {
    const display = useHover ? displayRating : value;
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              {...(useHover && {
                onMouseEnter: () => setHoverRating(star),
                onMouseLeave: () => setHoverRating(0),
              })}
              className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              {star <= display ? (
                <StarSolid className="h-7 w-7 text-amber-500" />
              ) : (
                <StarIcon className="h-7 w-7 text-slate-300" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
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
        aria-labelledby="leave-review-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="leave-review-title" className="text-xl font-semibold text-slate-900">
            Leave Review
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
          Rate your experience working with {coworkerName}.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <StarRow label="Rating (1–5 stars)" value={rating} onChange={setRating} useHover />
          <StarRow label="Reliability (1–5)" value={reliability} onChange={setReliability} />
          <StarRow label="Teamwork (1–5)" value={teamwork} onChange={setTeamwork} />
          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-slate-700 mb-1">
              Comment (optional)
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
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
              disabled={loading || rating < 1 || reliability < 1 || teamwork < 1}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit review"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
