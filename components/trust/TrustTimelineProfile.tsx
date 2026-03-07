"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TrustTimelineEventItem } from "@/app/api/trust/timeline/[profileId]/route";

const EVENT_LABELS: Record<string, string> = {
  coworker_verified: "Coworker verified employment",
  coworker_verification_confirmed: "Coworker verified employment",
  manager_verified: "Manager confirmed employment",
  employment_verified: "Manager confirmed employment",
  verification_confirmed: "Manager confirmed employment",
  verification_request_sent: "Verification request sent",
  employment_disputed: "Employment dispute reported",
  suspicious_verification: "Verification flagged for review",
  low_trust_verifier: "Low-trust account verification attempt",
  suspicious_network: "Suspicious network activity flagged",
  suspicious_ip_activity: "Suspicious IP activity flagged",
};

const TRUST_SCORE_EVENT_TYPES = new Set([
  "coworker_verified",
  "coworker_verification_confirmed",
  "manager_verified",
  "employment_verified",
  "verification_confirmed",
  "employment_disputed",
]);

function getEventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

interface TrustTimelineProfileProps {
  profileId: string;
}

export function TrustTimelineProfile({ profileId }: TrustTimelineProfileProps) {
  const [events, setEvents] = useState<TrustTimelineEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const limit = 50;

  const fetchEvents = useCallback(
    async (off: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/trust/timeline/${encodeURIComponent(profileId)}?limit=${limit}&offset=${off}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Failed to load");
        }
        const data = await res.json();
        const list = (data.events ?? []) as TrustTimelineEventItem[];
        const more = Boolean(data.hasMore);
        if (append) {
          setEvents((prev) => [...prev, ...list]);
        } else {
          setEvents(list);
        }
        setHasMore(more);
        setOffset(off + list.length);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        if (!append) setEvents([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [profileId]
  );

  const loadMore = useCallback(() => {
    fetchEvents(offset, true);
  }, [offset, fetchEvents]);

  useEffect(() => {
    fetchEvents(0, false);
  }, [fetchEvents]);

  if (loading && events.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Trust Timeline
        </h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  if (error && events.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Trust Timeline
        </h2>
        <p className="text-sm text-slate-500">{error}</p>
      </Card>
    );
  }

  let lastDate = "";

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Trust Timeline
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Chronological history of trust-related events for this candidate.
      </p>

      {events.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No trust events yet for this profile.
        </p>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700"
            aria-hidden
          />

          <ul className="space-y-0">
            {events.map((ev) => {
              const dateHeader = formatDateHeader(ev.created_at);
              const showDate = dateHeader !== lastDate;
              if (showDate) lastDate = dateHeader;
              const affectsScore = TRUST_SCORE_EVENT_TYPES.has(ev.event_type);

              return (
                <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Circular marker */}
                  <div
                    className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-white dark:bg-slate-800"
                    aria-hidden
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    {showDate && (
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                        {dateHeader}
                      </p>
                    )}
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {getEventLabel(ev.event_type)}
                    </p>
                    {affectsScore && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        Trust score updated
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more events"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
