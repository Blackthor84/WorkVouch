"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { getEmploymentMatchesForUser, type EmploymentMatchRow } from "@/lib/actions/employmentMatches";
import { MatchCard, type MatchCardData } from "@/components/workvouch/MatchCard";
import { MatchCardSkeleton } from "@/components/workvouch/MatchCardSkeleton";
import { EmptyState } from "@/components/workvouch/EmptyState";
import { Leaderboard } from "@/components/workvouch/Leaderboard";
import type { LeaderboardEntry } from "@/lib/actions/leaderboard";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function CoworkerMatchesClient({
  initialLeaderboard = [],
}: {
  initialLeaderboard?: LeaderboardEntry[];
}) {
  const [matches, setMatches] = useState<EmploymentMatchRow[]>([]);
  const [sentRequestStatus, setSentRequestStatus] = useState<Record<string, "pending" | "accepted">>({});
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const matchesChannelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user ? { id: user.id } : null);
    });
  }, []);

  useEffect(() => {
    getEmploymentMatchesForUser().then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    supabaseBrowser
      .from("reference_requests")
      .select("coworker_match_id, status")
      .eq("requester_id", currentUser.id)
      .then(({ data }) => {
        const statusByMatch: Record<string, "pending" | "accepted"> = {};
        for (const r of (data ?? []) as { coworker_match_id: string; status: string }[]) {
          if (r.status === "accepted" || r.status === "pending")
            statusByMatch[r.coworker_match_id] = r.status as "pending" | "accepted";
        }
        setSentRequestStatus(statusByMatch);
      });
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabaseBrowser
      .channel("realtime-matches")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "coworker_matches" },
        (payload: { new?: { user1_id: string; user2_id: string } }) => {
          const row = payload.new;
          if (!row) return;
          const isForCurrentUser = row.user1_id === currentUser.id || row.user2_id === currentUser.id;
          if (isForCurrentUser) getEmploymentMatchesForUser().then(setMatches);
        }
      )
      .subscribe();
    matchesChannelRef.current = channel;
    return () => {
      if (matchesChannelRef.current) {
        supabaseBrowser.removeChannel(matchesChannelRef.current);
        matchesChannelRef.current = null;
      }
    };
  }, [currentUser?.id]);

  // Realtime: update sent request status when receiver accepts
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabaseBrowser
      .channel("realtime-requests-sent")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reference_requests" },
        (payload: { new?: { requester_id: string; coworker_match_id: string; status: string } }) => {
          const row = payload.new;
          if (!row || row.requester_id !== currentUser.id || !row.coworker_match_id) return;
          if (row.status === "accepted" || row.status === "pending")
            setSentRequestStatus((prev) => ({ ...prev, [row.coworker_match_id]: row.status as "pending" | "accepted" }));
        }
      )
      .subscribe();
    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const requestReference = async (match: EmploymentMatchRow) => {
    if (!currentUser?.id) return;
    setRequestingId(match.id);
    const companyName = match.company_name || "the same company";
    const message = `We worked together at ${companyName} — would you vouch for me?`;
    const { error } = await supabaseBrowser.from("reference_requests").insert([
      {
        requester_id: currentUser.id,
        receiver_id: match.matched_user_id,
        coworker_match_id: match.id,
        message,
      },
    ]);
    if (error) {
      console.error(error);
      alert("Something went wrong");
    } else {
      setSentRequestStatus((prev) => ({ ...prev, [match.id]: "pending" }));
    }
    setRequestingId(null);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-start gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Coworkers you overlapped with. Request a reference to grow your trust score.
          </p>

      {loading ? (
        <ul className="mt-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </ul>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="h-7 w-7" />}
          title="No matches yet"
          description="Add jobs to your profile to find people who worked at the same company. Matches will show up here."
          action={
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Add a job
            </Link>
          }
          className="mt-8"
        />
      ) : (
        <ul className="mt-8 space-y-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match as MatchCardData}
              requestStatus={sentRequestStatus[match.id] ?? "none"}
              loading={requestingId === match.id}
              onRequestReference={() => requestReference(match)}
            />
          ))}
        </ul>
      )}
        </div>
        {initialLeaderboard.length > 0 && (
          <aside className="lg:w-72 shrink-0">
            <Leaderboard users={initialLeaderboard} />
          </aside>
        )}
      </div>
    </div>
  );
}
