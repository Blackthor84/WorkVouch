"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import type { TrustTimelineEvent } from "@/app/api/trust/timeline/route";
import {
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

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

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; section: string }
> = {
  verification: {
    label: "Verification",
    icon: CheckBadgeIcon,
    section: "Verifications",
  },
  reference: {
    label: "Reference",
    icon: ChatBubbleLeftRightIcon,
    section: "References",
  },
  dispute: {
    label: "Dispute",
    icon: ExclamationTriangleIcon,
    section: "Disputes",
  },
  credential_share: {
    label: "Credential share",
    icon: ShareIcon,
    section: "Credential shares",
  },
};

function eventLabel(ev: TrustTimelineEvent): string {
  const meta = ev.metadata ?? {};
  switch (ev.event_type) {
    case "verification":
      return (meta.company_name as string) ? `Employment verified at ${meta.company_name}` : "Employment verified";
    case "reference":
      return (meta.rating as number) ? `Reference received (${meta.rating}/5)` : "Reference received";
    case "dispute":
      return (meta.status as string) === "Resolved" ? "Dispute resolved" : "Dispute opened";
    case "credential_share":
      return (meta.kind as string) === "view" ? "Credential viewed" : "Credential shared";
    default:
      return ev.event_type.replace(/_/g, " ");
  }
}

export function TrustTimeline() {
  const [events, setEvents] = useState<TrustTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trust/timeline", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load timeline");
        return res.json();
      })
      .then((data: { events?: TrustTimelineEvent[] }) => {
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Trust Timeline</h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Trust Timeline</h2>
        <p className="text-sm text-slate-500">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Trust Timeline</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Chronological view of verifications, references, disputes, and credential shares.
      </p>

      {events.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No trust events yet. Verifications, references, and credential activity will appear here.
        </p>
      ) : (
        <ul className="space-y-0">
          {events.map((ev, i) => {
            const config = EVENT_CONFIG[ev.event_type] ?? {
              label: ev.event_type,
              icon: CheckBadgeIcon,
              section: "Other",
            };
            const Icon = config.icon;
            const impact = ev.impact ?? "neutral";
            return (
              <li
                key={ev.id}
                className="flex gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div
                  className={`flex-shrink-0 rounded-full p-1.5 ${
                    impact === "positive"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : impact === "negative"
                        ? "bg-amber-100 dark:bg-amber-900/30"
                        : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      impact === "positive"
                        ? "text-green-700 dark:text-green-400"
                        : impact === "negative"
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-slate-600 dark:text-slate-400"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {eventLabel(ev)}
                  </p>
                  {impact !== "neutral" && (
                    <span
                      className={`text-xs font-medium mt-0.5 inline-block px-2 py-0.5 rounded ${
                        impact === "positive"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {impact}
                    </span>
                  )}
                </div>
                <time
                  className="text-sm text-slate-500 dark:text-slate-400 shrink-0"
                  dateTime={ev.created_at}
                >
                  {formatDate(ev.created_at)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
