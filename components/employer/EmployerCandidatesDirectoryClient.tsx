"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CandidateInviteModal } from "./CandidateInviteModal";
import { CandidateStatusBadge } from "./CandidateStatusBadge";
import { WvBadge, WvButton, WvCard, WvEmptyState, WvLoadingState } from "@/components/wv";
import type {
  DirectoryCandidate,
  DirectoryResponse,
  DirectorySourceFilter,
} from "@/lib/employer/candidates/directory-types";

const SOURCE_TABS: Array<{ id: DirectorySourceFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "connect", label: "Imported" },
  { id: "linked", label: "Linked" },
  { id: "saved", label: "Saved" },
];

type Props = {
  planTier: string;
};

function providerLabel(provider?: string): string {
  if (!provider) return "ATS";
  if (provider === "greenhouse") return "Greenhouse";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function formatApplicationStatus(status?: string): string | null {
  if (!status) return null;
  return status.replace(/_/g, " ");
}

export function EmployerCandidatesDirectoryClient({ planTier }: Props) {
  const [source, setSource] = useState<DirectorySourceFilter>("all");
  const [connectionId, setConnectionId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteTarget, setInviteTarget] = useState<DirectoryCandidate | null>(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const isFree = planTier === "free" || !planTier;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("source", source);
      if (connectionId) params.set("connectionId", connectionId);
      if (query) params.set("q", query);
      const res = await fetch(`/api/employer/candidates/directory?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to load candidates");
      }
      const json = (await res.json()) as DirectoryResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidates");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [source, connectionId, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const connections = data?.connections ?? [];
  const hasConnection = connections.some((c) => c.status === "connected");

  const summary = useMemo(() => {
    if (!data) return null;
    return `${data.total} candidate${data.total === 1 ? "" : "s"} · ${data.meta.connectCount} imported · ${data.meta.linkedCount} linked · ${data.meta.workvouchCount} saved`;
  }, [data]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
  };

  const handleInviteConfirm = async () => {
    if (!inviteTarget) return;
    setInviteSending(true);
    setInviteError(null);
    try {
      const res = await fetch(
        `/api/employer/candidates/directory/${encodeURIComponent(inviteTarget.directoryId)}/invite`,
        { method: "POST", credentials: "include" }
      );
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || "Failed to send invitation");
      }
      setInviteTarget(null);
      await load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {SOURCE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSource(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                source === tab.id
                  ? "bg-violet-500/20 text-white ring-1 ring-violet-500/40"
                  : "text-wv-muted hover:bg-wv-surface hover:text-wv-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {connections.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-wv-muted">
            <span className="shrink-0">Connection</span>
            <select
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              className="rounded-lg border border-wv-border bg-wv-surface px-3 py-1.5 text-sm text-wv-foreground"
            >
              <option value="">All connections</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {providerLabel(c.provider)} ({c.status})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wv-subtle" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-wv-border bg-wv-surface py-2.5 pl-10 pr-4 text-sm text-wv-foreground placeholder:text-wv-subtle"
          />
        </div>
        <WvButton type="submit" variant="secondary" size="sm">
          Search
        </WvButton>
      </form>

      {summary && !loading && <p className="text-sm text-wv-muted">{summary}</p>}

      {isFree && (
        <p className="text-xs text-wv-subtle">
          Email addresses for imported candidates are partially masked on the free plan.
        </p>
      )}

      {inviteError && (
        <p className="text-sm text-red-400" role="alert">
          {inviteError}
        </p>
      )}

      {loading && (
        <WvCard className="p-12">
          <WvLoadingState label="Loading candidates…" />
        </WvCard>
      )}

      {!loading && error && (
        <WvCard className="p-6">
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        </WvCard>
      )}

      {!loading && !error && (data?.candidates.length ?? 0) === 0 && (
        <WvEmptyState
          title={hasConnection ? "No candidates yet" : "Connect your ATS"}
          description={
            hasConnection
              ? "Run a sync from Integrations to import candidates from Greenhouse."
              : "Connect Greenhouse to import candidates into your hiring pipeline."
          }
          action={
            <WvButton href="/employer/integrations" variant="secondary" size="sm">
              {hasConnection ? "Open integrations" : "Connect Greenhouse"}
            </WvButton>
          }
        />
      )}

      {!loading && !error && (data?.candidates.length ?? 0) > 0 && (
        <ul className="space-y-3">
          {data!.candidates.map((candidate) => (
            <CandidateDirectoryRow
              key={candidate.directoryId}
              candidate={candidate}
              onInvite={() => {
                setInviteError(null);
                setInviteTarget(candidate);
              }}
            />
          ))}
        </ul>
      )}

      {inviteTarget && (
        <CandidateInviteModal
          candidate={inviteTarget}
          open={Boolean(inviteTarget)}
          sending={inviteSending}
          onClose={() => {
            if (!inviteSending) setInviteTarget(null);
          }}
          onConfirm={() => void handleInviteConfirm()}
        />
      )}
    </div>
  );
}

function CandidateDirectoryRow({
  candidate,
  onInvite,
}: {
  candidate: DirectoryCandidate;
  onInvite: () => void;
}) {
  const applicationLabel = formatApplicationStatus(candidate.applicationStatus);
  const profileHref = candidate.profileId
    ? `/employer/profile/${candidate.profileId}`
    : undefined;
  const inviteSent =
    candidate.invitationStatus === "sent" || candidate.invitationStatus === "pending";

  return (
    <li>
      <WvCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-wv-foreground">
                {candidate.displayName}
              </h3>
              <CandidateStatusBadge status={candidate.platformStatus} />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-wv-muted">
              <span>{candidate.jobTitle}</span>
              {candidate.locationLabel && <span>{candidate.locationLabel}</span>}
              {applicationLabel && (
                <span className="capitalize">Stage: {applicationLabel}</span>
              )}
              {candidate.vouchCount != null && candidate.verificationBadge && (
                <span>{candidate.verificationBadge}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-wv-subtle">
              {candidate.provider && (
                <WvBadge variant="default">{providerLabel(candidate.provider)}</WvBadge>
              )}
              {candidate.emailMasked && <span>{candidate.emailMasked}</span>}
              {candidate.externalCandidateId && (
                <span>Candidate ID {candidate.externalCandidateId}</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {profileHref && (
              <WvButton href={profileHref} variant="secondary" size="sm">
                View profile
              </WvButton>
            )}
            {candidate.canInvite && (
              <WvButton type="button" variant="primary" size="sm" onClick={onInvite}>
                Invite to WorkVouch
              </WvButton>
            )}
            {inviteSent && candidate.source === "connect" && (
              <span className="inline-flex items-center rounded-lg border border-wv-border px-3 py-1.5 text-xs font-medium text-wv-muted">
                Invite Sent
              </span>
            )}
          </div>
        </div>
      </WvCard>
    </li>
  );
}
