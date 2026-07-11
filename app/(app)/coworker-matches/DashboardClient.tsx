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
import { Users, Inbox, FilePlus, CheckCircle, XCircle } from "lucide-react";
import { WvContainer, WvPageHeader, WvButton, WvCard, WvBadge } from "@/components/wv";

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
    <WvContainer size="narrow" className="py-8">
        {fromOnboarding && (
          <WvCard glow className="mb-6 border-blue-500/30 bg-blue-500/10">
            <p className="text-sm font-semibold text-blue-300">Guided setup — find coworkers</p>
            <p className="text-xs text-blue-200/80 mt-1">
              Confirm matches at the same employer. When you have at least one match, continue to step 3.
            </p>
            <Link
              href={
                trustOverview.coworkerMatches >= 1
                  ? "/onboarding?celebrate=matches"
                  : "/onboarding"
              }
              className="mt-2 inline-flex text-sm font-bold text-blue-400 hover:text-blue-300"
            >
              {trustOverview.coworkerMatches >= 1
                ? "Continue setup — Nice, you're building your profile →"
                : "Back to setup checklist →"}
            </Link>
          </WvCard>
        )}
        <WvPageHeader
          eyebrow="Your network"
          title="Coworker Matches"
          description="Your verified work reputation, powered by real coworkers"
          action={
            <WvButton href="/my-jobs" size="sm">
              <FilePlus className="h-4 w-4" aria-hidden />
              Add Job
            </WvButton>
          }
        />

        {/* Section 2: Trust Score Hero */}
        <section className="mb-8">
          <TrustScoreHeroCard data={trustOverview} />
        </section>

        {/* Section 3: Your Coworkers (Matches) */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-wv-foreground">Your Coworkers</h2>
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <WvCard glow className="flex flex-col items-center justify-center px-8 py-16 text-center animate-in fade-in duration-300">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-wv-bg ring-1 ring-wv-border">
                <Users className="h-8 w-8 text-wv-muted" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-wv-foreground">
                Add a coworker to get your first vouch
              </h3>
              <p className="mt-2 max-w-sm text-sm text-wv-muted">
                Add jobs with accurate dates—we use real overlap to suggest people you worked with, then you can request a vouch.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <WvButton href="/jobs/new">Add a job</WvButton>
                <WvButton href="/my-jobs" variant="secondary">Review my jobs</WvButton>
              </div>
            </WvCard>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-2">
                <p className="text-sm font-medium text-wv-muted">
                  Trust Score:{" "}
                  <strong className="text-wv-foreground">{Math.min(100, Math.max(0, trustOverview.trustScore ?? 0))}</strong>
                  {!(trustOverview.trustScore != null && trustOverview.trustScore > 0) && (
                    <span className="font-normal text-wv-subtle"> — add verifications to grow it</span>
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
                <div className="fixed bottom-4 right-4 z-[60] rounded-xl border border-wv-border bg-wv-surface px-4 py-3 text-sm font-medium text-wv-foreground shadow-xl animate-in fade-in duration-200">
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
          <h2 className="mb-4 text-lg font-semibold text-wv-foreground">Reference Requests</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <WvCard>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-wv-foreground">
                <Inbox className="h-5 w-5 text-blue-400" aria-hidden />
                Incoming
              </h3>
              {incoming.length === 0 ? (
                <p className="mt-3 text-sm text-wv-muted">No pending requests</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {incoming.slice(0, 5).map((req) => (
                    <li key={req.id} className="flex items-center justify-between rounded-lg border border-wv-border bg-wv-bg/50 py-2 px-3">
                      <span className="truncate text-sm text-wv-foreground">{profiles[req.requester_id]?.full_name ?? "Someone"}</span>
                      {req.status === "pending" ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => updateRequest(req.id, "accepted")}
                            disabled={updatingId === req.id}
                            className="rounded p-1.5 text-emerald-400 hover:bg-emerald-500/10"
                            title="Accept"
                          >
                            <CheckCircle className="h-5 w-5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRequest(req.id, "rejected")}
                            disabled={updatingId === req.id}
                            className="rounded p-1.5 text-red-400 hover:bg-red-500/10"
                            title="Reject"
                          >
                            <XCircle className="h-5 w-5" aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <WvBadge variant={req.status === "accepted" ? "success" : "default"} className="capitalize">
                          {req.status}
                        </WvBadge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {incoming.length > 5 && (
                <Link href="/requests" className="mt-2 block text-sm font-medium text-blue-400 hover:text-blue-300">View all →</Link>
              )}
            </WvCard>
            <WvCard>
              <h3 className="text-sm font-semibold text-wv-foreground">Outgoing</h3>
              {outgoing.length === 0 ? (
                <p className="mt-3 text-sm text-wv-muted">No sent requests</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {outgoing.slice(0, 5).map((req) => (
                    <li key={req.id} className="flex items-center justify-between rounded-lg border border-wv-border bg-wv-bg/50 py-2 px-3">
                      <span className="truncate text-sm text-wv-foreground">{profiles[req.receiver_id]?.full_name ?? "Coworker"}</span>
                      <WvBadge
                        variant={
                          req.status === "accepted" ? "success" : req.status === "pending" ? "warning" : "default"
                        }
                        className="capitalize"
                      >
                        {req.status}
                      </WvBadge>
                    </li>
                  ))}
                </ul>
              )}
              {outgoing.length > 5 && (
                <Link href="/requests" className="mt-2 block text-sm font-medium text-blue-400 hover:text-blue-300">View all →</Link>
              )}
            </WvCard>
          </div>
        </section>

        {/* Section 5: Quick Action */}
        <section>
          <BoostTrustScoreCard />
        </section>
    </WvContainer>
  );
}
