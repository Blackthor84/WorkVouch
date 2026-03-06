"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrustNetworkResponse, TrustNetworkNode } from "@/app/api/trust/network/[profileId]/route";
import { TrustNetworkGraph } from "@/components/trust/TrustNetworkGraph";
import {
  UserGroupIcon,
  CheckBadgeIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

type DepthBand = "minimal" | "moderate" | "strong" | "exceptional";
const DEPTH_LABELS: Record<DepthBand, string> = {
  minimal: "Minimal",
  moderate: "Moderate",
  strong: "Strong",
  exceptional: "Exceptional",
};

interface TrustNetworkPanelProps {
  /** When omitted, fetches current user from /api/user/me */
  profileId?: string;
  title?: string;
  className?: string;
}

function VerificationBadge({ level }: { level: string }) {
  const label = level === "verified" ? "Verified" : level === "confirmed" ? "Confirmed" : "Pending";
  const variant =
    level === "verified"
      ? "success"
      : level === "confirmed"
        ? "info"
        : "secondary";
  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
}

function NodeList({
  nodes,
  emptyMessage,
  icon: Icon,
  sectionLabel,
}: {
  nodes: TrustNetworkNode[];
  emptyMessage: string;
  icon: React.ComponentType<{ className?: string }>;
  sectionLabel: string;
}) {
  if (nodes.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
    );
  }
  return (
    <ul className="space-y-3" aria-label={sectionLabel}>
      {nodes.map((node) => (
        <li
          key={`${node.profile_id}-${node.relationship_type}-${node.created_at}`}
          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 p-1.5">
              <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {node.full_name ?? "Unknown"}
            </span>
          </div>
          <VerificationBadge level={node.verification_level} />
        </li>
      ))}
    </ul>
  );
}

export function TrustNetworkPanel({ profileId: propProfileId, title = "Trust Network", className }: TrustNetworkPanelProps) {
  const [profileId, setProfileId] = useState<string | null>(propProfileId ?? null);
  const [data, setData] = useState<TrustNetworkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let id: string | null | undefined = propProfileId;
      if (!id) {
        const meRes = await fetch("/api/user/me", { credentials: "include" });
        if (!meRes.ok || cancelled) return;
        const me = (await meRes.json()) as { user?: { id?: string } };
        id = me?.user?.id ?? null;
        if (!cancelled && id) setProfileId(id);
      }
      if (!id || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/trust/network/${encodeURIComponent(id)}`, { credentials: "include" });
        if (!res.ok) throw new Error(res.status === 403 ? "Access denied" : "Failed to load network");
        const body: TrustNetworkResponse = await res.json();
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [propProfileId]);

  if (loading) {
    return (
      <Card className={className ? `p-6 ${className}` : "p-6"}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className ? `p-6 ${className}` : "p-6"}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h2>
        <p className="text-sm text-slate-500">{error}</p>
      </Card>
    );
  }

  const hasAny =
    (data?.direct_connections?.length ?? 0) > 0 ||
    (data?.manager_confirmations?.length ?? 0) > 0 ||
    (data?.coworker_overlaps?.length ?? 0) > 0;

  const connectionCount = (data as TrustNetworkResponse)?.connectionCount ?? 0;
  const depthBand = ((data as TrustNetworkResponse)?.depthBand ?? "minimal") as DepthBand;
  const managerCount = data?.manager_confirmations?.length ?? 0;
  const coworkerCount = (data?.direct_connections?.length ?? 0) + (data?.coworker_overlaps?.length ?? 0);

  return (
    <Card className={className ? `p-6 ${className}` : "p-6"}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Verified relationships from employment overlaps, references, and manager/coworker confirmations.
      </p>

      {/* Section 6: Total Verified Connections, Manager, Coworker, Trust Graph Depth */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Verified Connections</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{connectionCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Manager Connections</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{managerCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Coworker Connections</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{coworkerCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Trust Graph Depth</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{DEPTH_LABELS[depthBand] ?? depthBand}</p>
        </div>
      </div>

      {hasAny && (data as TrustNetworkResponse)?.connections?.length ? (
        <div className="mb-6">
          <TrustNetworkGraph
            profileId={profileId ?? ""}
            profileName={null}
            connections={(data as TrustNetworkResponse).connections}
            depthBand={DEPTH_LABELS[depthBand] ?? depthBand}
          />
        </div>
      ) : null}

      {!hasAny ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No trust connections yet. Add jobs and request references to build your network.
        </p>
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4" />
              Verified relationships
            </h3>
            <NodeList
              nodes={data?.direct_connections ?? []}
              emptyMessage="No direct peer references yet."
              icon={UserGroupIcon}
              sectionLabel="Verified relationships"
            />
          </section>

          <section>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <CheckBadgeIcon className="h-4 w-4" />
              Manager confirmations
            </h3>
            <NodeList
              nodes={data?.manager_confirmations ?? []}
              emptyMessage="No manager confirmations yet."
              icon={CheckBadgeIcon}
              sectionLabel="Manager confirmations"
            />
          </section>

          <section>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Peer verification links
            </h3>
            <NodeList
              nodes={data?.coworker_overlaps ?? []}
              emptyMessage="No coworker overlaps yet."
              icon={LinkIcon}
              sectionLabel="Peer verification links"
            />
          </section>
        </div>
      )}
    </Card>
  );
}
