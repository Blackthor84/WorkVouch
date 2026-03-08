"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import type { TrustActivityEntry } from "@/app/api/user/trust-activity/route";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString();
}

export function TrustActivityTimeline() {
  const [events, setEvents] = useState<TrustActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/trust-activity", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load activity");
        return res.json();
      })
      .then((data: { events?: TrustActivityEntry[] }) => {
        if (!cancelled && Array.isArray(data.events)) setEvents(data.events);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Trust History</h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Trust History</h2>
        <p className="text-sm text-slate-500">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Trust History</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Real events that affect your trust profile: verifications, references, disputes, and credentials.
      </p>
      {events.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet. Add verified jobs, get verified, and request references to build your timeline.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((entry, i) => {
            const impactLabel: "positive" | "neutral" | "caution" =
              entry.impact != null && entry.impact > 0
                ? "positive"
                : entry.impact != null && entry.impact < 0
                  ? "caution"
                  : "neutral";
            return (
              <li key={`${entry.type}-${entry.date}-${i}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{entry.event}</span>
                  {impactLabel !== "neutral" && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        impactLabel === "positive"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {impactLabel === "positive" ? "positive" : "caution"}
                    </span>
                  )}
                  {entry.impact != null && entry.impact !== 0 && (
                    <span className={`text-sm ${entry.impact > 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {entry.impact > 0 ? `+${entry.impact}` : entry.impact}
                    </span>
                  )}
                </div>
                <time className="text-sm text-slate-500 dark:text-slate-400 shrink-0" dateTime={entry.date}>
                  {formatDate(entry.date)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
