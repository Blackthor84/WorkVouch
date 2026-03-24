"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { respondToRequest } from "@/lib/actions/referenceFeedback";
import { EmptyState } from "@/components/workvouch/EmptyState";
import { InboxStackIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ReferenceRequestRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  coworker_match_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

export function RequestsPageClient() {
  const [incoming, setIncoming] = useState<ReferenceRequestRow[]>([]);
  const [outgoing, setOutgoing] = useState<ReferenceRequestRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; profile_photo_url: string | null }>>({});
  const [companyByMatchId, setCompanyByMatchId] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [newRequestAlert, setNewRequestAlert] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const fetchAll = async (uid: string) => {
    const [
      { data: inc },
      { data: out },
    ] = await Promise.all([
      supabaseBrowser.from("reference_requests").select("*").eq("receiver_id", uid).order("created_at", { ascending: false }),
      supabaseBrowser.from("reference_requests").select("*").eq("requester_id", uid).order("created_at", { ascending: false }),
    ]);
    const incList = (inc ?? []) as ReferenceRequestRow[];
    const outList = (out ?? []) as ReferenceRequestRow[];
    setIncoming(incList);
    setOutgoing(outList);

    const matchIds = [...new Set([...incList.map((r) => r.coworker_match_id), ...outList.map((r) => r.coworker_match_id)])];
    if (matchIds.length > 0) {
      const { data: matches } = await supabaseBrowser.from("coworker_matches").select("id, company_name").in("id", matchIds);
      const company: Record<string, string> = {};
      (matches ?? []).forEach((m: { id: string; company_name: string | null }) => {
        company[m.id] = m.company_name ?? "Same company";
      });
      setCompanyByMatchId(company);
    }

    const requesterIds = [...new Set(incList.map((r) => r.requester_id))];
    const receiverIds = [...new Set(outList.map((r) => r.receiver_id))];
    const allIds = [...new Set([...requesterIds, ...receiverIds])];
    if (allIds.length > 0) {
      const { data: profs } = await supabaseBrowser.from("profiles").select("id, full_name, profile_photo_url").in("id", allIds);
      const map: Record<string, { full_name: string | null; profile_photo_url: string | null }> = {};
      (profs ?? []).forEach((p: { id: string; full_name: string | null; profile_photo_url: string | null }) => {
        map[p.id] = { full_name: p.full_name, profile_photo_url: p.profile_photo_url ?? null };
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchAll(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabaseBrowser
      .channel("requests-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "reference_requests" }, () => {
        fetchAll(userId);
        setNewRequestAlert(true);
        setTimeout(() => setNewRequestAlert(false), 5000);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabaseBrowser.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  const handleRespond = async (id: string, status: "accepted" | "rejected") => {
    setUpdatingId(id);
    await respondToRequest(id, status);
    setIncoming((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setUpdatingId(null);
  };

  if (loading) return null;

  const hasIncoming = incoming.length > 0;
  const hasOutgoing = outgoing.length > 0;

  if (!hasIncoming && !hasOutgoing) {
    return (
      <EmptyState
        icon={<InboxStackIcon className="h-7 w-7" />}
        title="Request your first vouch—or answer one"
        description="Send vouch requests from coworker matches, or accept incoming asks. Everything you send and receive lands here."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/coworker-matches"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Find coworkers
            </Link>
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Add a job
            </Link>
          </div>
        }
        className="mt-8"
      />
    );
  }

  return (
    <>
      {newRequestAlert && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-800">
          New reference request!
        </div>
      )}

      {hasIncoming && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Incoming Requests</h2>
          <ul className="mt-4 space-y-3">
            {incoming.map((req) => {
              const profile = profiles[req.requester_id];
              const name = profile?.full_name ?? "Someone";
              const company = companyByMatchId[req.coworker_match_id] ?? "Same company";
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
                        <p className="font-medium text-slate-900">{name}</p>
                        <p className="text-sm text-slate-500">{company}</p>
                        {req.message && (
                          <p className="text-sm text-slate-600 mt-1 truncate">&ldquo;{req.message}&rdquo;</p>
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
                          onClick={() => handleRespond(req.id, "accepted")}
                          disabled={updatingId === req.id}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {updatingId === req.id ? "…" : "Accept"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "rejected")}
                          disabled={updatingId === req.id}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className={cn(
                        "text-sm font-medium shrink-0 rounded-full px-3 py-1",
                        req.status === "accepted" && "bg-emerald-100 text-emerald-800",
                        req.status === "rejected" && "bg-slate-100 text-slate-600"
                      )}>
                        {req.status === "accepted" ? "Accepted" : "Declined"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {hasOutgoing && (
        <section className={hasIncoming ? "mt-10" : "mt-8"}>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <PaperAirplaneIcon className="h-5 w-5" />
            Outgoing Requests
          </h2>
          <ul className="mt-4 space-y-3">
            {outgoing.map((req) => {
              const profile = profiles[req.receiver_id];
              const name = profile?.full_name ?? "Coworker";
              const company = companyByMatchId[req.coworker_match_id] ?? "Same company";
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
                        <p className="font-medium text-slate-900">{name}</p>
                        <p className="text-sm text-slate-500">{company}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
                        req.status === "accepted" && "bg-emerald-100 text-emerald-800",
                        req.status === "pending" && "bg-amber-100 text-amber-800",
                        req.status === "rejected" && "bg-slate-100 text-slate-600"
                      )}
                    >
                      {req.status === "accepted" ? "Accepted" : req.status === "pending" ? "Pending" : "Declined"}
                    </span>
                  </div>
                  {req.status === "accepted" && (
                    <p className="mt-3 text-sm text-slate-500">
                      <Link href="/coworker-matches" className="font-medium text-slate-700 hover:underline">
                        Leave reference
                      </Link> on your matches page.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
