"use client";

import { useState } from "react";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { EmptyState } from "@/components/peercv/EmptyState";

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
      return <UserGroupIcon className="h-5 w-5 text-slate-600" />;
    case "reference_request":
    case "reference_received":
      return <DocumentTextIcon className="h-5 w-5 text-emerald-600" />;
    case "connection_confirmed":
      return <CheckCircleIcon className="h-5 w-5 text-slate-600" />;
    case "employer_purchase":
      return <CreditCardIcon className="h-5 w-5 text-violet-600" />;
    default:
      return <BellIcon className="h-5 w-5 text-slate-400" />;
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
      <EmptyState
        icon={<BellIcon className="h-7 w-7" />}
        title="No notifications yet"
        description="You'll see matches, reference requests, and other updates here."
        className="mt-8"
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      )}
      <ul className="space-y-3">
        {list.map((n) => (
          <li key={n.id}>
            <Link
              href={getActionLink(n)}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`block rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                !n.is_read
                  ? "border-slate-200/80 bg-slate-50/50"
                  : "border-slate-200/80"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200/80">
                  {getIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-sm font-semibold ${
                      !n.is_read ? "text-slate-900" : "text-slate-600"
                    }`}
                  >
                    {n.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-slate-900 mt-2" />
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
