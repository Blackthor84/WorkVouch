"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import {
  Users,
  FileText,
  CheckCircle2,
  CreditCard,
  Bell,
} from "lucide-react";
import Link from "next/link";
import {
  WvCard,
  WvButton,
  WvEmptyState,
} from "@/components/wv";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_user_id?: string;
  related_job_id?: string;
  related_connection_id?: string;
}

function getIcon(type: string) {
  switch (type) {
    case "coworker_match":
      return <Users className="h-5 w-5 text-wv-brand-blue" aria-hidden />;
    case "reference_request":
    case "reference_received":
      return <FileText className="h-5 w-5 text-emerald-400" aria-hidden />;
    case "connection_confirmed":
      return <CheckCircle2 className="h-5 w-5 text-wv-brand-green" aria-hidden />;
    case "employer_purchase":
      return <CreditCard className="h-5 w-5 text-violet-400" aria-hidden />;
    default:
      return <Bell className="h-5 w-5 text-wv-muted" aria-hidden />;
  }
}

function getActionLink(n: Notification) {
  if (n.related_job_id) return `/jobs/${n.related_job_id}/coworkers`;
  if (n.related_user_id) return `/references/request?userId=${n.related_user_id}`;
  return "/coworker-matches";
}

export function NotificationsPanel({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const router = useRouter();
  const [list, setList] = useState(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    router.refresh();
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsRead();
    setList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAll(false);
    router.refresh();
  };

  const unreadCount = list.filter((n) => !n.is_read).length;

  if (list.length === 0) {
    return (
      <WvEmptyState
        icon={<Bell className="h-6 w-6" />}
        title="You're all caught up"
        description="Matches, reference requests, and verification updates will appear here as your network grows."
        action={
          <WvButton href="/coworker-matches" size="sm">
            Find coworker matches
          </WvButton>
        }
        className="mt-8"
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <WvButton
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            Mark all as read
          </WvButton>
        </div>
      )}
      <ul className="space-y-3">
        {list.map((n) => (
          <li key={n.id}>
            <Link
              href={getActionLink(n)}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/40 rounded-2xl"
            >
              <WvCard
                padding="md"
                className={!n.is_read ? "border-wv-brand-blue/30 bg-wv-surface-hover/50" : ""}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wv-surface ring-1 ring-wv-border">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-sm font-semibold ${
                        !n.is_read ? "text-wv-foreground" : "text-wv-muted"
                      }`}
                    >
                      {n.title}
                    </h3>
                    <p className="mt-1 text-sm text-wv-muted">{n.message}</p>
                    <p className="mt-2 text-xs text-wv-subtle">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-wv-brand-blue" aria-hidden />
                  )}
                </div>
              </WvCard>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
