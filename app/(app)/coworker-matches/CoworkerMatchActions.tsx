"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  matchId: string;
  matchStatus: string;
  employmentMatchId: string;
  otherUserId: string;
  isRecordOwner: boolean;
};

export function CoworkerMatchActions({
  matchId,
  matchStatus,
  employmentMatchId,
  otherUserId,
  isRecordOwner,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState(matchStatus);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleConfirmReject = async (newStatus: "confirmed" | "rejected") => {
    setLoading(newStatus);
    try {
      const res = await fetch("/api/employment/confirm-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) setStatus(newStatus);
    } finally {
      setLoading(null);
    }
  };

  const handleSubmitReview = async () => {
    setLoading("review");
    try {
      const res = await fetch("/api/employment-references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employment_match_id: employmentMatchId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      if (res.ok) setShowReviewForm(false);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {status === "pending" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleConfirmReject("confirmed")}
            disabled={!!loading}
          >
            {loading === "confirmed" ? "..." : "Confirm match"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleConfirmReject("rejected")}
            disabled={!!loading}
          >
            {loading === "rejected" ? "..." : "Reject"}
          </Button>
        </div>
      )}
      {status === "confirmed" && (
        <>
          <Button
            size="sm"
            variant="secondary"
            href={`/messages?user=${otherUserId}`}
          >
            Request review (message)
          </Button>
          {!showReviewForm ? (
            <Button size="sm" onClick={() => setShowReviewForm(true)}>
              Leave a review
            </Button>
          ) : (
            <div className="border rounded p-3 space-y-2 bg-slate-50 dark:bg-slate-900">
              <label className="block text-sm font-medium">Rating (1–5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="border rounded px-2 py-1 w-full"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <label className="block text-sm font-medium">Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="border rounded px-2 py-1 w-full min-h-[60px]"
                placeholder="Optional comment"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmitReview} disabled={!!loading}>
                  {loading === "review" ? "..." : "Submit review"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
