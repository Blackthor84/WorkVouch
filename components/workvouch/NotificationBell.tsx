"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function NotificationBell({
  unreadCount: initialCount = 0,
  className,
  variant = "default",
}: {
  unreadCount?: number;
  className?: string;
  /** Matches WorkVouch blue header pills (Trust / Guide / Avatar). */
  variant?: "default" | "header";
}) {
  const [count, setCount] = useState(initialCount);
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user?.id) {
      setCount(0);
      return;
    }
    const { count: unread, error } = await supabaseBrowser
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (!error) setCount(unread ?? 0);
  };

  useEffect(() => {
    fetchNotifications();

    let channel: ReturnType<typeof supabaseBrowser.channel> | null = null;
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      if (!user?.id) return;
      channel = supabaseBrowser
        .channel("notifications-bell")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchNotifications()
        )
        .subscribe();
      channelRef.current = channel;
    });

    return () => {
      if (channelRef.current) {
        supabaseBrowser.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setCount((prev) => (initialCount >= 0 ? initialCount : prev));
  }, [initialCount]);

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative flex h-10 w-10 items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        variant === "header"
          ? "rounded-lg bg-blue-500/20 text-white hover:bg-blue-500/30 hover:text-white focus:ring-white/40 focus:ring-offset-blue-600"
          : "rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300 focus:ring-offset-2",
        className
      )}
      aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
    >
      <BellIcon className="h-5 w-5" strokeWidth={1.8} />
      {count > 0 && (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
            variant === "header"
              ? "bg-white text-blue-700"
              : "bg-slate-900 text-white"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
