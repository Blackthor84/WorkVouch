"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

type TrustTimelineEvent = {
  id: string;
  event_type: string;
  impact: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return diffDays + " days ago";
  if (diffDays < 30) return Math.floor(diffDays / 7) + " weeks ago";
  return d.toLocaleDateString();
}

function eventLabel(ev: TrustTimelineEvent): string {
  const meta = ev.metadata ?? {};
  switch (ev.event_type) {
    case "verification":
      return (meta.company_name as string) ? "Employment verified at " + meta.company_name : "Employment verified";
    case "reference":
      return (meta.rating as number) ? "Reference received (" + meta.rating + "/5)" : "Reference received";
    case "dispute":
      return (meta.status as string) === "Resolved" ? "Dispute resolved" : "Dispute opened";
    case "credential_share":
      return (meta.kind as string) === "view" ? "Credential viewed" : "Credential shared";
    default:
      return ev.event_type.replace(/_/g, " ");
  }
}

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  verification: CheckBadgeIcon,
  reference: ChatBubbleLeftRightIcon,
  dispute: ExclamationTriangleIcon,
  credential_share: ShareIcon,
};

export function TrustTimelinePanel({ candidateId }: { candidateId: string }) {
  const [events, setEvents] = useState<TrustTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/employer/candidate/" + encodeURIComponent(candidateId) + "/timeline", { credentials: "include" })
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
    return () => { cancelled = true; };
  }, [candidateId]);

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
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Verifications, references, disputes, and credential activity for this candidate.</p>
      {events.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No trust events yet for this candidate.</p>
      ) : (
        <ul className="space-y-0">
          {events.map((ev) => {
            const Icon = EVENT_ICONS[ev.event_type] ?? CheckBadgeIcon;
            const impact = ev.impact ?? "neutral";
            return (
              <li key={ev.id} className="flex gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className={"flex-shrink-0 rounded-full p-1.5 " + (impact === "positive" ? "bg-green-100 dark:bg-green-900/30" : impact === "negative" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-slate-100 dark:bg-slate-800")}>
                  <Icon className={"h-4 w-4 " + (impact === "positive" ? "text-green-700 dark:text-green-400" : impact === "negative" ? "text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-slate-400")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{eventLabel(ev)}</p>
                </div>
                <time className="text-sm text-slate-500 dark:text-slate-400 shrink-0" dateTime={ev.created_at}>{formatDate(ev.created_at)}</time>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
