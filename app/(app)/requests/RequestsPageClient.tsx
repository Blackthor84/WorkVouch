"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { respondToRequest } from "@/lib/actions/referenceFeedback";
import { EmptyState } from "@/components/workvouch/EmptyState";
import { Inbox, Send } from "lucide-react";
import Link from "next/link";
import { WvCard, WvButton, WvBadge } from "@/components/wv";

type ReferenceRequestRow = {
  id: string;
  requester_id: string;
  receiver_id: string;
  coworker_match_id: string;
  message: string | null;
  status: string;
  created_at: string;
};

function RequestAvatar({
  photoUrl,
  name,
}: {
  photoUrl: string | null | undefined;
  name: string;
}) {
  const initial = name.charAt(0).toUpperCase();
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-wv-border"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-600/20 text-sm font-semibold text-blue-300 ring-1 ring-wv-border">
      {initial}
    </div>
  );
}

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
    const [{ data: inc }, { data: out }] = await Promise.all([
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
        icon={<Inbox className="h-7 w-7" aria-hidden />}
        title="Request your first vouch—or answer one"
        description="Send vouch requests from coworker matches, or accept incoming asks. Everything you send and receive lands here."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <WvButton href="/coworker-matches">Find coworkers</WvButton>
            <WvButton href="/jobs/new" variant="secondary">Add a job</WvButton>
          </div>
        }
        className="mt-8"
      />
    );
  }

  return (
    <>
      {newRequestAlert && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
          New reference request!
        </div>
      )}

      {hasIncoming && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-wv-foreground">Incoming Requests</h2>
          <ul className="mt-4 space-y-3">
            {incoming.map((req) => {
              const profile = profiles[req.requester_id];
              const name = profile?.full_name ?? "Someone";
              const company = companyByMatchId[req.coworker_match_id] ?? "Same company";
              return (
                <li key={req.id}>
                  <WvCard hover>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <RequestAvatar photoUrl={profile?.profile_photo_url} name={name} />
                        <div className="min-w-0">
                          <p className="font-medium text-wv-foreground">{name}</p>
                          <p className="text-sm text-wv-muted">{company}</p>
                          {req.message && (
                            <p className="text-sm text-wv-muted mt-1 truncate">&ldquo;{req.message}&rdquo;</p>
                          )}
                          <p className="text-xs text-wv-subtle mt-0.5">
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {req.status === "pending" ? (
                        <div className="flex gap-2 shrink-0">
                          <WvButton
                            type="button"
                            size="sm"
                            onClick={() => handleRespond(req.id, "accepted")}
                            disabled={updatingId === req.id}
                          >
                            {updatingId === req.id ? "…" : "Accept"}
                          </WvButton>
                          <WvButton
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRespond(req.id, "rejected")}
                            disabled={updatingId === req.id}
                          >
                            Decline
                          </WvButton>
                        </div>
                      ) : (
                        <WvBadge variant={req.status === "accepted" ? "success" : "default"}>
                          {req.status === "accepted" ? "Accepted" : "Declined"}
                        </WvBadge>
                      )}
                    </div>
                  </WvCard>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {hasOutgoing && (
        <section className={hasIncoming ? "mt-10" : "mt-8"}>
          <h2 className="text-lg font-semibold text-wv-foreground flex items-center gap-2">
            <Send className="h-5 w-5 text-violet-400" aria-hidden />
            Outgoing Requests
          </h2>
          <ul className="mt-4 space-y-3">
            {outgoing.map((req) => {
              const profile = profiles[req.receiver_id];
              const name = profile?.full_name ?? "Coworker";
              const company = companyByMatchId[req.coworker_match_id] ?? "Same company";
              return (
                <li key={req.id}>
                  <WvCard hover>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <RequestAvatar photoUrl={profile?.profile_photo_url} name={name} />
                        <div className="min-w-0">
                          <p className="font-medium text-wv-foreground">{name}</p>
                          <p className="text-sm text-wv-muted">{company}</p>
                          <p className="text-xs text-wv-subtle mt-0.5">
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <WvBadge
                        variant={
                          req.status === "accepted" ? "success" : req.status === "pending" ? "warning" : "default"
                        }
                      >
                        {req.status === "accepted" ? "Accepted" : req.status === "pending" ? "Pending" : "Declined"}
                      </WvBadge>
                    </div>
                    {req.status === "accepted" && (
                      <p className="mt-3 text-sm text-wv-muted">
                        <Link href="/coworker-matches" className="font-medium text-blue-400 hover:text-blue-300">
                          Leave reference
                        </Link>{" "}
                        on your matches page.
                      </p>
                    )}
                  </WvCard>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
