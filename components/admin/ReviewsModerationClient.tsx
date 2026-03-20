"use client";

import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";

type Review = {
  id: string;
  source: "employment" | "coworker";
  reviewer_name: string | null;
  reviewed_name: string | null;
  reviewer_email: string | null;
  reviewed_email: string | null;
  rating: number;
  comment: string | null;
  flagged: boolean;
  created_at: string | null;
};

export function ReviewsModerationClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/control-center/reviews", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      setReviews(Array.isArray(json.reviews) ? json.reviews : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (r: Review) => {
    setActing(r.id);
    try {
      await fetch(`/api/admin/control-center/reviews/${r.id}?source=${r.source}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: r.source }),
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  const flag = async (r: Review) => {
    if (r.source !== "employment") return;
    setActing(r.id);
    try {
      await fetch(`/api/admin/control-center/reviews/${r.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "employment", flagged: !r.flagged }),
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return <p className="text-slate-500 p-6">Loading reviews…</p>;
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-4">Reviewer</th>
              <th className="p-4">Reviewed</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Comment</th>
              <th className="p-4">Source</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No data yet
                </td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={`${r.source}-${r.id}`} className="hover:bg-slate-50/50">
                  <td className="p-4 text-slate-800">
                    {r.reviewer_name || "—"}
                    <div className="text-xs text-slate-500">{r.reviewer_email}</div>
                  </td>
                  <td className="p-4 text-slate-800">
                    {r.reviewed_name || "—"}
                    <div className="text-xs text-slate-500">{r.reviewed_email}</div>
                  </td>
                  <td className="p-4 font-medium">{r.rating}</td>
                  <td className="p-4 text-slate-600 max-w-xs truncate" title={r.comment ?? ""}>
                    {r.comment || "—"}
                  </td>
                  <td className="p-4 text-slate-500">
                    {r.source}
                    {r.flagged ? <span className="ml-2 text-amber-700">Flagged</span> : null}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {r.source === "employment" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={acting === r.id}
                        onClick={() => flag(r)}
                      >
                        {r.flagged ? "Unflag" : "Flag"}
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={acting === r.id}
                      onClick={() => remove(r)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
