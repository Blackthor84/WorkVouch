"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export type ActivityRow = {
  id: string;
  user_id: string;
  action: string;
  target: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function formatMessage(row: ActivityRow): string {
  const actionLabel = String(row.action ?? "")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
  return row.target ? `${actionLabel}: ${row.target}` : actionLabel;
}

function formatTime(createdAt: string | null): string {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface RecentActivityFeedProps {
  userId: string;
  /** Optional server-fetched rows for first paint (avoids empty flash) */
  initialActivities?: ActivityRow[];
}

export function RecentActivityFeed({ userId, initialActivities }: RecentActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityRow[]>(initialActivities ?? []);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);

  // Initial fetch (once); skip if server already passed initial data
  useEffect(() => {
    if (!userId) return;
    if (initialActivities != null && initialActivities.length > 0) {
      return; // use server data; realtime will add new rows
    }

    supabaseBrowser
      .from("activity_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setActivities((data as ActivityRow[] | null) ?? []);
      });
  }, [userId, initialActivities]);

  // Realtime subscription: INSERT filtered by user_id; prepend new row and animate
  useEffect(() => {
    if (!userId) return;

    const channel = supabaseBrowser
      .channel("activity-log")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as ActivityRow;
          setActivities((prev) => [row, ...prev]);
          setNewlyAddedIds((prev) => new Set(prev).add(row.id));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabaseBrowser.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  // Clear "new" highlight after animation so we don't keep animating the same row
  useEffect(() => {
    if (newlyAddedIds.size === 0) return;
    const t = setTimeout(() => setNewlyAddedIds(new Set()), 400);
    return () => clearTimeout(t);
  }, [newlyAddedIds]);

  return (
    <div className="space-y-3">
      {activities.length > 0 ? (
        activities.map((row) => (
          <div
            key={row.id}
            className={`flex items-start gap-3 p-3 rounded-xl bg-slate-50 ${newlyAddedIds.has(row.id) ? "animate-fade-in" : ""}`}
          >
            <div className="h-2 w-2 rounded-full bg-[#2563EB] mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#334155]">{formatMessage(row)}</p>
              <p className="text-xs text-[#64748B] mt-1">{formatTime(row.created_at)}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-[#64748B] py-4 text-center">No activity yet</p>
      )}
    </div>
  );
}
