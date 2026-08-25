import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { InvitationQueueItem, InvitationQueueStatus } from "../../orchestration/types";
import type { InvitationQueueRepository } from "../repositories/invitation-queue-repository";

function mapRow(row: Record<string, unknown>): InvitationQueueItem {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    employerAccountId: String(row.employer_account_id),
    externalCandidateId: String(row.external_candidate_id),
    candidateEmail: String(row.candidate_email),
    candidateName: row.candidate_name ? String(row.candidate_name) : undefined,
    jobExternalId: row.job_external_id ? String(row.job_external_id) : undefined,
    status: String(row.status) as InvitationQueueStatus,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : undefined,
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
    retryCount: Number(row.retry_count ?? 0),
    maxRetries: Number(row.max_retries ?? 3),
    correlationId: String(row.correlation_id),
    ruleId: row.rule_id ? String(row.rule_id) : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseInvitationQueueRepository implements InvitationQueueRepository {
  constructor(private readonly client: SupabaseClient) {}

  async enqueue(
    input: Omit<InvitationQueueItem, "id" | "createdAt" | "updatedAt" | "retryCount" | "maxRetries" | "sentAt"> & {
      retryCount?: number;
      maxRetries?: number;
    }
  ): Promise<InvitationQueueItem> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("connect_invitation_queue")
      .insert({
        id: randomUUID(),
        connection_id: input.connectionId,
        employer_account_id: input.employerAccountId,
        external_candidate_id: input.externalCandidateId,
        candidate_email: input.candidateEmail,
        candidate_name: input.candidateName ?? null,
        job_external_id: input.jobExternalId ?? null,
        status: input.status,
        scheduled_at: input.scheduledAt ?? null,
        retry_count: input.retryCount ?? 0,
        max_retries: input.maxRetries ?? 3,
        correlation_id: input.correlationId,
        rule_id: input.ruleId ?? null,
        metadata: input.metadata ?? {},
        updated_at: now,
      })
      .select("*")
      .single();
    if (error) throw new Error(`Invitation queue enqueue failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async markSent(id: string): Promise<InvitationQueueItem | null> {
    return this.patch(id, { status: "sent", sent_at: new Date().toISOString() });
  }

  async markFailed(id: string, errorMessage: string): Promise<InvitationQueueItem | null> {
    const row = await this.getById(id);
    if (!row) return null;
    const retryCount = row.retryCount + 1;
    const status: InvitationQueueStatus = retryCount >= row.maxRetries ? "failed" : "retry";
    return this.patch(id, {
      status,
      retry_count: retryCount,
      metadata: { ...row.metadata, lastError: errorMessage },
    });
  }

  async cancel(id: string): Promise<InvitationQueueItem | null> {
    return this.patch(id, { status: "cancelled" });
  }

  async expire(id: string): Promise<InvitationQueueItem | null> {
    return this.patch(id, { status: "expired" });
  }

  async getById(id: string): Promise<InvitationQueueItem | null> {
    const { data, error } = await this.client
      .from("connect_invitation_queue")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Invitation queue get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async listByConnection(connectionId: string, status?: InvitationQueueStatus): Promise<InvitationQueueItem[]> {
    let query = this.client.from("connect_invitation_queue").select("*").eq("connection_id", connectionId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(`Invitation queue list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  async listByCandidate(
    connectionId: string,
    externalCandidateId: string,
    status?: InvitationQueueStatus
  ): Promise<InvitationQueueItem[]> {
    let query = this.client
      .from("connect_invitation_queue")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("external_candidate_id", externalCandidateId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(`Invitation queue list by candidate failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  async processDueScheduled(): Promise<InvitationQueueItem[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("connect_invitation_queue")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);
    if (error) throw new Error(`Invitation queue process scheduled failed: ${error.message}`);
    const processed: InvitationQueueItem[] = [];
    for (const row of data ?? []) {
      const updated = await this.markSent(String((row as Record<string, unknown>).id));
      if (updated) processed.push(updated);
    }
    return processed;
  }

  private async patch(
    id: string,
    patch: Record<string, unknown>
  ): Promise<InvitationQueueItem | null> {
    const { data, error } = await this.client
      .from("connect_invitation_queue")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Invitation queue patch failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }
}
