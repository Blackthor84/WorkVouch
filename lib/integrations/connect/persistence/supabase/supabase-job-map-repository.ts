import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { ConnectJobMapRow } from "../types";
import type { JobMapRepository } from "../repositories/job-map-repository";

function mapRow(row: Record<string, unknown>): ConnectJobMapRow {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    externalJobId: String(row.external_job_id),
    jobTitle: row.job_title ? String(row.job_title) : undefined,
    status: row.status ? String(row.status) : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseJobMapRepository implements JobMapRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsert(input: Omit<ConnectJobMapRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectJobMapRow> {
    const { data, error } = await this.client
      .from("connect_job_map")
      .upsert(
        {
          id: randomUUID(),
          connection_id: input.connectionId,
          external_job_id: input.externalJobId,
          job_title: input.jobTitle ?? null,
          status: input.status ?? null,
          metadata: input.metadata,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "connection_id,external_job_id" }
      )
      .select("*")
      .single();
    if (error) throw new Error(`Job map upsert failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getByExternalId(connectionId: string, externalJobId: string): Promise<ConnectJobMapRow | null> {
    const { data, error } = await this.client
      .from("connect_job_map")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("external_job_id", externalJobId)
      .maybeSingle();
    if (error) throw new Error(`Job map get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async listByConnection(connectionId: string): Promise<ConnectJobMapRow[]> {
    const { data, error } = await this.client
      .from("connect_job_map")
      .select("*")
      .eq("connection_id", connectionId);
    if (error) throw new Error(`Job map list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
