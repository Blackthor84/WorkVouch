/**
 * Simulation Lab & Enterprise Intelligence types.
 * Fully typed; no placeholders. Used by admin lab, investor sandbox, data density.
 */

import type { Database } from "./supabase";

export type SimulationSessionRow = Database["public"]["Tables"]["simulation_sessions"]["Row"];
export type SimulationSessionInsert = Database["public"]["Tables"]["simulation_sessions"]["Insert"];

export type DataDensitySnapshotRow = Database["public"]["Tables"]["data_density_snapshots"]["Row"];
export type DataDensitySnapshotInsert = Database["public"]["Tables"]["data_density_snapshots"]["Insert"];

export type UnifiedIntelligenceScoreRow = Database["public"]["Tables"]["unified_intelligence_scores"]["Row"];
export type UnifiedIntelligenceScoreInsert = Database["public"]["Tables"]["unified_intelligence_scores"]["Insert"];

export interface SimulationPurgeResult {
  deleted_table: string;
  deleted_count: number;
}

export interface DataDensityMetrics {
  scope: "global" | "session" | "employer";
  scopeId: string | null;
  profilesCount: number;
  employmentRecordsCount: number;
  referencesCount: number;
  intelligenceRowsCount: number;
  snapshotAt: string;
}

export interface AdSimulationInput {
  channel: string;
  budgetCents: number;
  cpcCents: number;
  conversionPct: number;
}

export interface AdSimulationProjection {
  clicks: number;
  signups: number;
  verifications: number;
  revenueCents: number;
  dataDensityGrowthPct: number;
}

export interface HiddenFeatureOverride {
  key: string;
  enabled: boolean;
  scope: "global" | "user" | "employer";
  scopeId?: string | null;
}
