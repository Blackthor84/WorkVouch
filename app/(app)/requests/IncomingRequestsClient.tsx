"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { EmptyState } from "@/components/peercv/EmptyState";
import { InboxStackIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type ReferenceRequestRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  coworker_match_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

export function IncomingRequestsClient() {
  const [requests, setRequests] = useState<ReferenceRequestRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; profile_photo_url: string | null }>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const fetchRequests = async (uid: string) => {
    const { data: list } = await supabaseBrowser
      .from("reference_requests")
      .select("*")
      .eq("receiver_id", uid)
      .order("created_at", { ascending: false });
    const incomingList = (list ?? []) as ReferenceRequestRow[];
    setRequests(incomingList);

    const requesterIds = [...new Set(incomingList.map((r) => r.requester_id))];
    if (requesterIds.length > 0) {
      const { data: profs } = await supabaseBrowser
        .from("profiles")
        .select("id, full_name, profile_photo_url")
        .in("id", requesterIds);
      const map: Record<string, { full_name: string | null; profile_photo_url: string | null }> = {};
      for (const p of (profs ?? []) as { id: string; full_name: string | null; profile_photo_url: string | null }[]) {
        map[p.id] = { full_name: p.full_name, profile_photo_url: p.profile_photo_url ?? null };
      }
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchRequests(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabaseBrowser
      .channel("realtime-requests-incoming")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reference_requests" },
        (payload: { eventType: string; new?: ReferenceRequestRow; old?: ReferenceRequestRow }) => {
          const row = payload.new;
          const oldRow = payload.old;
          if (payload.eventType === "INSERT" && row && row.receiver_id === userId) {
            setRequests((prev) => [row, ...prev]);
            supabaseBrowser
              .from("profiles")
              .select("id, full_name, profile_photo_url")
              .eq("id", row.requester_id)
              .single()
              .then(({ data: p }) => {
                if (p)
                  setProfiles((prev) => ({
                    ...prev,
                    [row.requester_id]: { full_name: (p as any).full_name, profile_photo_url: (p as any).profile_photo_url ?? null },
                  }));
              });
          } else if (payload.eventType === "UPDATE" && row && row.receiver_id === userId) {
            setRequests((prev) => prev.map((r) => (r.id === row.id ? row : r)));
          } else if (payload.eventType === "DELETE" && oldRow && oldRow.receiver_id === userId) {
            setRequests((prev) => prev.filter((r) => r.id !== oldRow.id));
          }
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

  const updateRequest = async (id: string, status: "accepted" | "rejected") => {
    setUpdatingId(id);
    await supabaseBrowser
      .from("reference_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setUpdatingId(null);
  };

  if (loading) return null;

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<InboxStackIcon className="h-7 w-7" />}
        title="No incoming requests"
        description="When someone asks you for a reference, it will show up here."
        action={
          <Link
            href="/coworker-matches"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            View matches
          </Link>
        }
        className="mt-8"
      />
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {requests.map((req) => {
        const profile = profiles[req.requester_id];
        const name = profile?.full_name ?? "Someone";
        const initial = name.charAt(0).toUpperCase();
        return (
          <li
            key={req.id}
            className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-slate-100"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {initial}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{name} requested a reference</p>
                  {req.message && (
                    <p className="text-sm text-slate-500 truncate">&ldquo;{req.message}&rdquo;</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {req.status === "pending" ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateRequest(req.id, "accepted")}
                    disabled={updatingId === req.id}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updatingId === req.id ? "…" : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRequest(req.id, "rejected")}
                    disabled={updatingId === req.id}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="text-sm font-medium text-slate-500 capitalize shrink-0">{req.status}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
