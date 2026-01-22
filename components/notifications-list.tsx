"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

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

export function NotificationsList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    router.refresh();
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsRead();
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAll(false);
    router.refresh();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "coworker_match":
        return (
          <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        );
      case "reference_request":
      case "reference_received":
        return (
          <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        );
      case "connection_confirmed":
        return (
          <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        );
      case "employer_purchase":
        return (
          <CreditCardIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        );
      default:
        return (
          <BellIcon className="h-5 w-5 text-grey-medium dark:text-gray-400" />
        );
    }
  };

  const getActionLink = (notification: Notification) => {
    if (notification.related_job_id) {
      return `/jobs/${notification.related_job_id}/coworkers`;
    }
    if (notification.related_user_id) {
      return `/references/request?userId=${notification.related_user_id}`;
    }
    return "/dashboard";
  };

  if (localNotifications.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-grey-medium dark:text-gray-400">
            No notifications yet. You'll see updates here when you have new
            matches or references.
          </p>
        </div>
      </Card>
    );
  }

  const unreadCount = localNotifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {localNotifications.map((notification) => (
          <div
            key={notification.id}
            className="cursor-pointer"
            onClick={() =>
              !notification.is_read && handleMarkRead(notification.id)
            }
          >
            <Card
              className={`transition-all ${
                !notification.is_read
                  ? "border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                  : "border-grey-background dark:border-[#374151]"
              }`}
            >
              <Link href={getActionLink(notification)}>
                <div className="flex items-start gap-4 p-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3
                          className={`text-sm font-semibold ${
                            !notification.is_read
                              ? "text-grey-dark dark:text-gray-200"
                              : "text-grey-medium dark:text-gray-400"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-grey-light dark:text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
