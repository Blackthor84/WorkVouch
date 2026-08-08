"use client";

import { useSearchParams } from "next/navigation";
import { GreenhousePanelClient } from "@/components/integrations/greenhouse/GreenhousePanelClient";

export function GreenhousePanelPageClient() {
  const params = useSearchParams();
  const candidateId = params.get("candidateId") ?? params.get("externalCandidateId") ?? "demo";
  const connectionId = params.get("connectionId") ?? undefined;
  const token = params.get("token") ?? undefined;
  const demo = params.get("demo") === "1" || candidateId === "demo";

  return (
    <GreenhousePanelClient
      externalCandidateId={candidateId}
      connectionId={connectionId}
      panelToken={token}
      demo={demo}
    />
  );
}
