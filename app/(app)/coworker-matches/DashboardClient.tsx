"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { getEmploymentMatchesForUser, type EmploymentMatchRow } from "@/lib/actions/employmentMatches";
import { getTrustOverview, type TrustOverview } from "@/lib/actions/trustOverview";
import { requestReference as requestReferenceAction, submitReference } from "@/lib/actions/referenceFeedback";
import { submitCoworkerReference, getReviewedMatchIds } from "@/lib/actions/coworkerReferences";
import { TrustScoreHeroCard } from "@/components/workvouch/TrustScoreHeroCard";
import { CoworkerMatchCard } from "@/components/coworker-matches/CoworkerMatchCard";
import { RequestReferenceModal } from "@/components/matches/RequestReferenceModal";
import { ReferenceFormModal } from "@/components/matches/ReferenceFormModal";
import { CoworkerReviewModal } from "@/components/matches/CoworkerReviewModal";
import { MatchCardSkeleton } from "@/components/workvouch/MatchCardSkeleton";
import { MatchProfileModal } from "@/components/workvouch/MatchProfileModal";
import type { MatchCardData } from "@/components/workvouch/MatchCard";
import { BoostTrustScoreCard } from "@/components/workvouch/BoostTrustScoreCard";
import { confirmCoworkerMatch, denyCoworkerMatch } from "@/lib/actions/confirmMatch";
import { UserGroupIcon, InboxStackIcon, DocumentPlusIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
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

const defaultTrustOverview: TrustOverview = {
  trustScore: 0,
  verifiedReferences: 0,
  coworkerMatches: 0,
  completedJobs: 0,
};

export default function DashboardClient({
  initialTrustOverview,
}: {
  initialTrustOverview: TrustOverview | null;
}) {
  const searchParams = useSearchParams();
  const fromOnboarding = searchParams.get("from") === "onboarding";
  const [trustOverview, setTrustOverview] = useState<TrustOverview>(
    initialTrustOverview ?? defaultTrustOverview
  );
  const [matches, setMatches] = useState<EmploymentMatchRow[]>([]);
  const [sentRequestStatus, setSentRequestStatus] = useState<Record<string, "pending" | "accepted" | "rejected">>({});
  const [incoming, setIncoming] = useState<RefRequest[]>([]);
  const [outgoing, setOutgoing] = useState<RefRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [profileModalMatch, setProfileModalMatch] = useState<MatchCardData | null>(null);
  const [requestModalMatch, setRequestModalMatch] = useState<EmploymentMatchRow | null>(null);
  const [leaveReferenceRequest, setLeaveReferenceRequest] = useState<{ requestId: string; requesterName: string } | null>(null);
  const [submittedReferenceRequestIds, setSubmittedReferenceRequestIds] = useState<Set<string>>(new Set());
  const [reviewedMatchIds, setReviewedMatchIds] = useState<Set<string>>(new Set());
  const [leaveReviewMatch, setLeaveReviewMatch] = useState<EmploymentMatchRow | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
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
        const sorted = [...(data ?? [])].sort((a, b) => (b.match_confidence ?? 0) - (a.match_confidence ?? 0));
        setMatches(sorted);
      }),
    ])
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
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
        { data: feedback },
      ] = await Promise.all([
        supabaseBrowser.from("reference_requests").select("*").eq("receiver_id", userId).order("created_at", { ascending: false }),
        supabaseBrowser.from("reference_requests").select("*").eq("requester_id", userId).order("created_at", { ascending: false }),
        supabaseBrowser.from("reference_feedback").select("request_id").eq("author_id", userId),
      ]);
      setIncoming((inc ?? []) as RefRequest[]);
      setOutgoing((out ?? []) as RefRequest[]);
      const submitted = new Set((feedback ?? []).map((f: { request_id: string }) => f.request_id));
      setSubmittedReferenceRequestIds(submitted);
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

  const openRequestModal = (match: EmploymentMatchRow) => setRequestModalMatch(match);

  const submitRequestReference = async (message: string) => {
    if (!requestModalMatch || !userId) return;
    setRequestingId(requestModalMatch.id);
    const { error } = await requestReferenceAction(requestModalMatch.id, requestModalMatch.matched_user_id, message || undefined);
    setRequestingId(null);
    setRequestModalMatch(null);
    if (!error) {
      setSentRequestStatus((prev) => ({ ...prev, [requestModalMatch.id]: "pending" }));
      setToast("Request sent");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const openLeaveReference = (requestId: string) => {
    const match = matches.find((m) => {
      const req = outgoing.find((r) => r.coworker_match_id === m.id && r.status === "accepted");
      return req?.id === requestId;
    });
    setLeaveReferenceRequest({
      requestId,
      requesterName: match?.other_user?.full_name?.trim() ?? "This person",
    });
  };

  const submitLeaveReference = async (rating: number, feedback: string) => {
    if (!leaveReferenceRequest) return;
    const requestId = leaveReferenceRequest.requestId;
    const { error } = await submitReference(requestId, rating, feedback || undefined);
    setLeaveReferenceRequest(null);
    if (!error) {
      setSubmittedReferenceRequestIds((prev) => new Set(prev).add(requestId));
      setToast("Reference submitted");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleConfirmCoworker = async (matchId: string) => {
    setConfirmingId(matchId);
    const { ok } = await confirmCoworkerMatch(matchId);
    if (ok) {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "confirmed" } : m))
      );
    }
    setConfirmingId(null);
  };

  const handleDenyCoworker = async (matchId: string) => {
    setConfirmingId(matchId);
    const { ok } = await denyCoworkerMatch(matchId);
    if (ok) {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "rejected" } : m))
      );
    }
    setConfirmingId(null);
  };

  const handleSubmitCoworkerReview = async (data: { rating: number; reliability: number; teamwork: number; comment: string }) => {
    if (!leaveReviewMatch) return;
    setSubmittingReview(true);
    const { error } = await submitCoworkerReference({
      matchId: leaveReviewMatch.id,
      reviewedId: leaveReviewMatch.otherUserId,
      rating: data.rating,
      reliability: data.reliability,
      teamwork: data.teamwork,
      comment: data.comment || null,
    });
    setSubmittingReview(false);
    setLeaveReviewMatch(null);
    if (!error) {
      setReviewedMatchIds((prev) => new Set(prev).add(leaveReviewMatch.id));
      setToast("Review submitted");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const updateRequest = async (id: string, status: "accepted" | "rejected") => {
    setUpdatingId(id);
    await supabaseBrowser.from("reference_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setIncoming((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {fromOnboarding && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/40">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Guided setup — find coworkers</p>
            <p className="text-xs text-blue-800/90 dark:text-blue-200/90 mt-1">
              Confirm matches at the same employer. When you have at least one match, continue to step 3.
            </p>
            <Link
              href={
                trustOverview.coworkerMatches >= 1
                  ? "/onboarding?celebrate=matches"
                  : "/onboarding"
              }
              className="mt-2 inline-flex text-sm font-bold text-blue-700 hover:text-blue-800 dark:text-blue-300"
            >
              {trustOverview.coworkerMatches >= 1
                ? "Continue setup — Nice, you're building your profile →"
                : "Back to setup checklist →"}
            </Link>
          </div>
        )}
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Coworker Matches
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your verified work reputation, powered by real coworkers
            </p>
          </div>
          <Link
            href="/my-jobs"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-slate-900 shadow-sm transition-colors hover:bg-slate-800 dark:hover:bg-slate-100"
          >
            <DocumentPlusIcon className="h-5 w-5" />
            Add Job
          </Link>
        </div>

        {/* Section 2: Trust Score Hero */}
        <section className="mb-8">
          <TrustScoreHeroCard data={trustOverview} />
        </section>

        {/* Section 3: Your Coworkers (Matches) */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Your Coworkers</h2>
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-8 py-16 text-center shadow-md animate-in fade-in duration-300">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <UserGroupIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Add a coworker to get your first vouch
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Add jobs with accurate dates—we use real overlap to suggest people you worked with, then you can request a vouch.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/jobs/new"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                  Add a job
                </Link>
                <Link
                  href="/my-jobs"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-md transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Review my jobs
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  ⭐ Trust Score:{" "}
                  <strong>{Math.min(100, Math.max(0, trustOverview.trustScore ?? 0))}</strong>
                  {!(trustOverview.trustScore != null && trustOverview.trustScore > 0) && (
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      {" "}
                      — add verifications to grow it
                    </span>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {matches.map((match, index) => (
                  <div
                    key={match.id}
                    className="animate-in fade-in duration-300"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" } as React.CSSProperties}
                  >
                    <CoworkerMatchCard
                      match={match}
                      requestStatus={(outgoing.find((r) => r.coworker_match_id === match.id)?.status as "pending" | "accepted" | "rejected") ?? sentRequestStatus[match.id] ?? "none"}
                      acceptedRequestId={(() => {
                        const req = outgoing.find((r) => r.coworker_match_id === match.id && r.status === "accepted");
                        return req && !submittedReferenceRequestIds.has(req.id) ? req.id : null;
                      })()}
                      hasLeftReview={reviewedMatchIds.has(match.id)}
                      loading={requestingId === match.id}
                      confirming={confirmingId === match.id}
                      onViewProfile={() => setProfileModalMatch(match as MatchCardData)}
                      onRequestReference={() => openRequestModal(match)}
                      onLeaveReference={openLeaveReference}
                      onLeaveReview={() => setLeaveReviewMatch(match)}
                      onConfirm={() => handleConfirmCoworker(match.id)}
                      onDeny={() => handleDenyCoworker(match.id)}
                    />
                  </div>
                ))}
              </div>
              {toast && (
                <div className="fixed bottom-4 right-4 z-[60] rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in duration-200">
                  {toast}
                </div>
              )}
              {requestModalMatch && (
                <RequestReferenceModal
                  coworkerName={requestModalMatch.other_user?.full_name?.trim() ?? "Coworker"}
                  companyName={requestModalMatch.company_name ?? "Same company"}
                  onClose={() => setRequestModalMatch(null)}
                  onSubmit={submitRequestReference}
                  loading={requestingId === requestModalMatch.id}
                />
              )}
              {leaveReferenceRequest && (
                <ReferenceFormModal
                  requesterName={leaveReferenceRequest.requesterName}
                  onClose={() => setLeaveReferenceRequest(null)}
                  onSubmit={submitLeaveReference}
                />
              )}
              {leaveReviewMatch && (
                <CoworkerReviewModal
                  coworkerName={leaveReviewMatch.other_user?.full_name?.trim() ?? "Coworker"}
                  onClose={() => setLeaveReviewMatch(null)}
                  onSubmit={handleSubmitCoworkerReview}
                  loading={submittingReview}
                />
              )}
              {profileModalMatch && (
                <MatchProfileModal
                  match={profileModalMatch}
                  onClose={() => setProfileModalMatch(null)}
                />
              )}
            </>
          )}
        </section>

        {/* Reference Requests */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Reference Requests</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-md">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
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
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-md">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Outgoing</h3>
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
