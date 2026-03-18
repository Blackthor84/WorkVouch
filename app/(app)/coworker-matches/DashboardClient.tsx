"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { getEmploymentMatchesForUser, type EmploymentMatchRow } from "@/lib/actions/employmentMatches";
import { getTrustOverview, type TrustOverview } from "@/lib/actions/trustOverview";
import { TrustScoreHeroCard } from "@/components/workvouch/TrustScoreHeroCard";
import { MatchCard, type MatchCardData } from "@/components/workvouch/MatchCard";
import { MatchCardSkeleton } from "@/components/workvouch/MatchCardSkeleton";
import { EmptyState } from "@/components/workvouch/EmptyState";
import { BoostTrustScoreCard } from "@/components/workvouch/BoostTrustScoreCard";
import { UserGroupIcon, InboxStackIcon, ArrowUpTrayIcon, DocumentPlusIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type RefRequest = {
  id: string;
  requester_id: string;
  receiver_id: string;
  coworker_match_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

export default function DashboardClient({
  initialTrustOverview,
}: {
  initialTrustOverview: TrustOverview;
}) {
  const [trustOverview, setTrustOverview] = useState<TrustOverview>(initialTrustOverview);
  const [matches, setMatches] = useState<EmploymentMatchRow[]>([]);
  const [sentRequestStatus, setSentRequestStatus] = useState<Record<string, "pending" | "accepted" | "rejected">>({});
  const [incoming, setIncoming] = useState<RefRequest[]>([]);
  const [outgoing, setOutgoing] = useState<RefRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    Promise.all([
      getTrustOverview().then(setTrustOverview),
      getEmploymentMatchesForUser().then((data) => {
        setMatches([...data].sort((a, b) => (b.match_confidence ?? 0) - (a.match_confidence ?? 0)));
      }),
    ]).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    supabaseBrowser
      .from("reference_requests")
      .select("coworker_match_id, status")
      .eq("requester_id", userId)
      .then(({ data }) => {
        const statusByMatch: Record<string, "pending" | "accepted" | "rejected"> = {};
        for (const r of (data ?? []) as { coworker_match_id: string; status: string }[]) {
          statusByMatch[r.coworker_match_id] = r.status as "pending" | "accepted" | "rejected";
        }
        setSentRequestStatus(statusByMatch);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [
        { data: inc },
        { data: out },
      ] = await Promise.all([
        supabaseBrowser.from("reference_requests").select("*").eq("receiver_id", userId).order("created_at", { ascending: false }),
        supabaseBrowser.from("reference_requests").select("*").eq("requester_id", userId).order("created_at", { ascending: false }),
      ]);
      setIncoming((inc ?? []) as RefRequest[]);
      setOutgoing((out ?? []) as RefRequest[]);
      const incomingIds = [...new Set((inc ?? []).map((r: RefRequest) => r.requester_id))];
      const outgoingIds = [...new Set((out ?? []).map((r: RefRequest) => r.receiver_id))];
      const allIds = [...new Set([...incomingIds, ...outgoingIds])].filter(Boolean);
      if (allIds.length > 0) {
        const { data: p } = await supabaseBrowser.from("profiles").select("id, full_name").in("id", allIds);
        const map: Record<string, { full_name: string | null }> = {};
        (p ?? []).forEach((x: { id: string; full_name: string | null }) => { map[x.id] = { full_name: x.full_name }; });
        setProfiles((prev) => ({ ...prev, ...map }));
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabaseBrowser
      .channel("dashboard-ref-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "reference_requests" }, () => {
        supabaseBrowser.from("reference_requests").select("*").eq("receiver_id", userId).order("created_at", { ascending: false }).then(({ data }) => setIncoming((data ?? []) as RefRequest[]));
        supabaseBrowser.from("reference_requests").select("*").eq("requester_id", userId).order("created_at", { ascending: false }).then(({ data }) => setOutgoing((data ?? []) as RefRequest[]));
      })
      .subscribe();
    channelRef.current = ch;
    return () => { if (channelRef.current) supabaseBrowser.removeChannel(channelRef.current); };
  }, [userId]);

  const requestReference = async (match: EmploymentMatchRow) => {
    if (!userId) return;
    setRequestingId(match.id);
    const message = `We worked together at ${match.company_name || "the same company"} — would you vouch for me?`;
    const { error } = await supabaseBrowser.from("reference_requests").insert([{ requester_id: userId, receiver_id: match.matched_user_id, coworker_match_id: match.id, message }]);
    if (!error) setSentRequestStatus((prev) => ({ ...prev, [match.id]: "pending" }));
    setRequestingId(null);
  };

  const updateRequest = async (id: string, status: "accepted" | "rejected") => {
    setUpdatingId(id);
    await supabaseBrowser.from("reference_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setIncoming((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Section 1: Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Trust Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your verified work reputation, powered by real coworkers
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              <DocumentPlusIcon className="h-5 w-5" />
              Add Job
            </Link>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Upload Resume
            </Link>
            <Link
              href="/requests"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Request Verification
            </Link>
          </div>
        </div>

        {/* Section 2: Trust Score Hero */}
        <section className="mb-8">
          <TrustScoreHeroCard data={trustOverview} />
        </section>

        {/* Section 3: Coworker Matches */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Coworker Matches</h2>
          {loading ? (
            <ul className="space-y-4">
              {[1, 2, 3].map((i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </ul>
          ) : matches.length === 0 ? (
            <EmptyState
              icon={<UserGroupIcon className="h-7 w-7" />}
              title="No coworkers found yet"
              description="Add more job details to unlock matches"
              action={
                <Link href="/jobs/new" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                  Add a job
                </Link>
              }
              className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm"
            />
          ) : (
            <ul className="space-y-4">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match as MatchCardData}
                  requestStatus={sentRequestStatus[match.id] === "accepted" ? "accepted" : sentRequestStatus[match.id] === "pending" ? "pending" : "none"}
                  loading={requestingId === match.id}
                  onRequestReference={() => requestReference(match)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Section 4: Reference Requests */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Reference Requests</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <InboxStackIcon className="h-5 w-5" />
                Incoming
              </h3>
              {incoming.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No pending requests</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {incoming.slice(0, 5).map((req) => (
                    <li key={req.id} className="flex items-center justify-between rounded-lg border border-slate-100 py-2 px-3">
                      <span className="truncate text-sm text-slate-700">{profiles[req.requester_id]?.full_name ?? "Someone"}</span>
                      {req.status === "pending" ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => updateRequest(req.id, "accepted")}
                            disabled={updatingId === req.id}
                            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                            title="Accept"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRequest(req.id, "rejected")}
                            disabled={updatingId === req.id}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50"
                            title="Reject"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <span className={cn("text-xs font-medium capitalize", req.status === "accepted" ? "text-emerald-600" : "text-slate-500")}>{req.status}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {incoming.length > 5 && (
                <Link href="/requests" className="mt-2 block text-sm font-medium text-slate-600 hover:text-slate-900">View all →</Link>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">Outgoing</h3>
              {outgoing.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No sent requests</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {outgoing.slice(0, 5).map((req) => (
                    <li key={req.id} className="flex items-center justify-between rounded-lg border border-slate-100 py-2 px-3">
                      <span className="truncate text-sm text-slate-700">{profiles[req.receiver_id]?.full_name ?? "Coworker"}</span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        req.status === "accepted" && "bg-emerald-100 text-emerald-800",
                        req.status === "pending" && "bg-amber-100 text-amber-800",
                        req.status === "rejected" && "bg-slate-100 text-slate-600"
                      )}>
                        {req.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {outgoing.length > 5 && (
                <Link href="/requests" className="mt-2 block text-sm font-medium text-slate-600 hover:text-slate-900">View all →</Link>
              )}
            </div>
          </div>
        </section>

        {/* Section 5: Quick Action */}
        <section>
          <BoostTrustScoreCard />
        </section>
      </div>
    </div>
  );
}
