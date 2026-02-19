"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ScenarioRehireRow } from "./types";
import type { EmployerDamageRow } from "./EmployerDamageBarChart";
import type { HeatmapCell } from "./ReputationHeatmap";

function toNumber(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

export function useRehireBreakdown(scenarioId: string | null) {
  return useQuery({
    queryKey: ["rehire", scenarioId],
    queryFn: async () => {
      const { data: rows, error } = await supabaseBrowser
        .from("playground_rehire_breakdown")
        .select("*")
        .eq("playground_scenario_id", scenarioId);
      if (error) throw error;
      return (rows ?? []).map(
        (r: { playground_scenario_id: string; would_rehire: boolean; total: unknown }): ScenarioRehireRow => ({
          playground_scenario_id: r.playground_scenario_id,
          would_rehire: r.would_rehire,
          total: toNumber(r.total),
        })
      );
    },
    enabled: !!scenarioId,
  });
}

export function useEmployerDamage(scenarioId: string | null) {
  const [data, setData] = useState<EmployerDamageRow[] | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!scenarioId) {
      setData(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const { data: rows, error: e } = await supabaseBrowser.rpc("get_employer_damage", {
          scenario_id: scenarioId,
        });
        if (cancelled) return;
        if (e) {
          setError(e);
          setData(undefined);
          return;
        }
        setData(
          (rows ?? []).map((r: { job_id: string; avg_rating: unknown }) => ({
            job_id: r.job_id,
            avg_rating: toNumber(r.avg_rating),
          }))
        );
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  return { data, error, isLoading };
}

export function useReputationHeatmap(scenarioId: string | null) {
  const [data, setData] = useState<HeatmapCell[] | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!scenarioId) {
      setData(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const { data: rows, error: e } = await supabaseBrowser.rpc("get_reputation_heatmap_cells", {
          scenario_id: scenarioId,
        });
        if (cancelled) return;
        if (e) {
          setError(e);
          setData(undefined);
          return;
        }
        setData(
          (rows ?? []).map(
            (r: { would_rehire: boolean; intensity: unknown; reputation_score: unknown }) => ({
              would_rehire: r.would_rehire,
              intensity: toNumber(r.intensity),
              reputation_score: toNumber(r.reputation_score),
            })
          )
        );
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  return { data, error, isLoading };
}
