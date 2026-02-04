"use client";

import { useState, useEffect, useRef } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface EmployerNotification {
  id: string;
  type: string;
  related_user_id: string | null;
  related_record_id: string | null;
  read: boolean;
  created_at: string;
}

export function EmployerNotificationsBell() {
  const [notifications, setNotifications] = useState<EmployerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/employer/notifications", { credentials: "include" });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count ?? 0);
      }
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await fetch("/api/employer/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - ids.length));
    } catch {
      // ignore
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "employee_listed_company":
        return "New employee listed your company";
      case "verification_requested":
        return "Verification requested";
      case "employment_disputed":
        return "Employment disputed";
      default:
        return type.replace(/_/g, " ");
    }
  };

  if (loading) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-1 rounded hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
        aria-label="Employer notifications"
      >
        <BellIcon className="h-6 w-6 text-grey-dark dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-auto rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] shadow-lg z-50">
          <div className="p-2 border-b border-grey-background dark:border-[#374151] flex items-center justify-between">
            <span className="font-semibold text-sm text-grey-dark dark:text-gray-200">Employer notifications</span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
                  markAsRead(unreadIds);
                }}
                className="text-xs text-primary dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-grey-medium dark:text-gray-400">No notifications</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border-b border-grey-background/50 dark:border-[#374151]/50 text-left ${!n.read ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}
                >
                  <p className="text-sm text-grey-dark dark:text-gray-200">{typeLabel(n.type)}</p>
                  <p className="text-xs text-grey-medium dark:text-gray-500 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                  {n.related_record_id && (
                    <Link
                      href="/employer/listed-employees"
                      className="text-xs text-primary dark:text-blue-400 hover:underline mt-1 inline-block"
                      onClick={() => {
                        setOpen(false);
                        markAsRead([n.id]);
                      }}
                    >
                      View listed employees
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead([n.id])}
                      className="text-xs text-grey-medium dark:text-gray-500 hover:underline mt-1 ml-2"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-grey-background dark:border-[#374151]">
            <Link
              href="/employer/listed-employees"
              className="text-xs text-primary dark:text-blue-400 hover:underline"
              onClick={() => setOpen(false)}
            >
              View all listed employees
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
