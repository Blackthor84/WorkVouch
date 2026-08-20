import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { ConnectCandidateMapRow } from "../types";
import type { CandidateMapRepository } from "../repositories/candidate-map-repository";

function mapRow(row: Record<string, unknown>): ConnectCandidateMapRow {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    externalCandidateId: String(row.external_candidate_id),
    workvouchProfileId: row.workvouch_profile_id ? String(row.workvouch_profile_id) : undefined,
    candidateEmail: row.candidate_email ? String(row.candidate_email) : undefined,
    candidateName: row.candidate_name ? String(row.candidate_name) : undefined,
    applicationStatus: row.application_status ? String(row.application_status) : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseCandidateMapRepository implements CandidateMapRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsert(
    input: Omit<ConnectCandidateMapRow, "id" | "createdAt" | "updatedAt">
  ): Promise<ConnectCandidateMapRow> {
    const { data, error } = await this.client
      .from("connect_candidate_map")
      .upsert(
        {
          id: randomUUID(),
          connection_id: input.connectionId,
          external_candidate_id: input.externalCandidateId,
          workvouch_profile_id: input.workvouchProfileId ?? null,
          candidate_email: input.candidateEmail ?? null,
          candidate_name: input.candidateName ?? null,
          application_status: input.applicationStatus ?? null,
          metadata: input.metadata,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "connection_id,external_candidate_id" }
      )
      .select("*")
      .single();
    if (error) throw new Error(`Candidate map upsert failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getByExternalId(connectionId: string, externalCandidateId: string): Promise<ConnectCandidateMapRow | null> {
    const { data, error } = await this.client
      .from("connect_candidate_map")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("external_candidate_id", externalCandidateId)
      .maybeSingle();
    if (error) throw new Error(`Candidate map get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async listByConnection(connectionId: string): Promise<ConnectCandidateMapRow[]> {
    const { data, error } = await this.client
      .from("connect_candidate_map")
      .select("*")
      .eq("connection_id", connectionId);
    if (error) throw new Error(`Candidate map list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
