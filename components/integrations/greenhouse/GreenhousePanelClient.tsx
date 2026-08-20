"use client";

import { useCallback, useEffect, useState } from "react";
import type { GreenhousePanelPayload } from "@/lib/integrations/greenhouse/panel/types";
import { WorkVouchPanel } from "./WorkVouchPanel";
import { PanelHeaderSkeleton } from "./LoadingStates";
import { PanelErrorState } from "./ErrorStates";

export interface GreenhousePanelClientProps {
  externalCandidateId: string;
  connectionId?: string;
  panelToken?: string;
  demo?: boolean;
  scenario?: string;
}

export function GreenhousePanelClient({
  externalCandidateId,
  connectionId,
  panelToken,
  demo,
  scenario = "high",
}: GreenhousePanelClientProps) {
  const [data, setData] = useState<GreenhousePanelPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (demo) {
        params.set("demo", "1");
        params.set("scenario", scenario);
      }
      if (connectionId) params.set("connectionId", connectionId);

      const headers: HeadersInit = {};
      if (panelToken) headers["X-Panel-Token"] = panelToken;

      const res = await fetch(
        `/api/integrations/v1/panel/greenhouse/${encodeURIComponent(externalCandidateId)}?${params}`,
        { headers, cache: "no-store" }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to load panel");
      }

      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load panel");
    } finally {
      setLoading(false);
    }
  }, [connectionId, demo, externalCandidateId, panelToken, scenario]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <PanelHeaderSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] p-4">
        <PanelErrorState message={error} onRetry={load} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <WorkVouchPanel
      data={data}
      onRefresh={load}
      onRetrySync={() => {
        window.open("/employer/integrations/greenhouse", "_blank", "noopener,noreferrer");
      }}
      onReplayWorkflow={() => {
        if (data.connectionId) {
          window.open(
            `/employer/integrations/replay?connectionId=${data.connectionId}`,
            "_blank",
            "noopener,noreferrer"
          );
        }
      }}
    />
  );
}
