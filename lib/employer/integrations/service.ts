import { CONNECT_PLATFORM_VERSION } from "@/lib/integrations/connect/version";
import { GREENHOUSE_MANIFEST } from "@/lib/integrations/providers/greenhouse/config/manifest";
import type { ConnectionSummary } from "@/lib/integrations/connect/connection/types";
import type { ConnectRuntime } from "@/lib/integrations/connect/connect-runtime";

export interface IntegrationDashboardStats {
  eventsProcessed: number;
  candidatesImported: number;
  jobsImported: number;
  applicationsImported: number;
  automationEnabled: boolean;
  automationTrigger?: string;
}

export interface IntegrationProviderCard {
  provider: string;
  displayName: string;
  connectionId?: string;
  status: ConnectionSummary["status"] | "not_connected";
  healthScore?: number;
  healthStatus?: string;
  providerAccountName?: string;
  lastSyncAt?: string;
  nextSyncAt?: string;
  connectVersion: string;
  providerVersion: string;
  stats?: IntegrationDashboardStats;
}

export async function listEmployerConnections(
  runtime: ConnectRuntime,
  employerAccountId: string
): Promise<ConnectionSummary[]> {
  return runtime.connections.listByEmployer(employerAccountId);
}

async function countByConnection(table: string, connectionId: string): Promise<number> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return 0;
  try {
    const { admin } = await import("@/lib/supabase-admin");
    const { count, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("connection_id", connectionId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countEventsByConnection(connectionId: string): Promise<number> {
  return countByConnection("connect_event_store", connectionId);
}

export async function getConnectionStats(
  runtime: ConnectRuntime,
  connection: ConnectionSummary
): Promise<IntegrationDashboardStats> {
  const [candidates, jobs, events] = await Promise.all([
    countByConnection("connect_candidate_map", connection.connectionId),
    countByConnection("connect_job_map", connection.connectionId),
    countEventsByConnection(connection.connectionId),
  ]);

  const automation = (connection.metadata?.sync_preferences as Record<string, unknown> | undefined)?.automation as
    | Record<string, unknown>
    | undefined;

  return {
    eventsProcessed: events,
    candidatesImported: candidates,
    jobsImported: jobs,
    applicationsImported: candidates,
    automationEnabled: automation?.auto_invite_enabled !== false,
    automationTrigger: automation?.auto_invite_trigger ? String(automation.auto_invite_trigger) : undefined,
  };
}

export async function buildProviderCards(
  runtime: ConnectRuntime,
  employerAccountId: string
): Promise<IntegrationProviderCard[]> {
  const connections = await listEmployerConnections(runtime, employerAccountId);
  const greenhouse = connections.find((c) => c.provider === "greenhouse");

  const cards: IntegrationProviderCard[] = [];

  if (greenhouse) {
    let healthScore: number | undefined;
    let healthStatus: string | undefined;
    try {
      const report = await runtime.health.evaluate(greenhouse.connectionId);
      healthScore = report.overallScore;
      healthStatus = report.overallStatus;
    } catch {
      healthStatus = "unknown";
    }

    const cursor = await runtime.connections.getCursor(greenhouse.connectionId);
    const stats = await getConnectionStats(runtime, greenhouse);

    cards.push({
      provider: "greenhouse",
      displayName: "Greenhouse",
      connectionId: greenhouse.connectionId,
      status: greenhouse.status,
      healthScore,
      healthStatus,
      providerAccountName: greenhouse.providerAccountName,
      lastSyncAt: greenhouse.lastSyncAt,
      nextSyncAt: cursor?.nextScheduledSync ?? undefined,
      connectVersion: CONNECT_PLATFORM_VERSION,
      providerVersion: GREENHOUSE_MANIFEST.version,
      stats,
    });
  } else {
    cards.push({
      provider: "greenhouse",
      displayName: "Greenhouse",
      status: "not_connected",
      connectVersion: CONNECT_PLATFORM_VERSION,
      providerVersion: GREENHOUSE_MANIFEST.version,
    });
  }

  cards.push(
    { provider: "lever", displayName: "Lever", status: "not_connected", connectVersion: CONNECT_PLATFORM_VERSION, providerVersion: "—" },
    { provider: "ashby", displayName: "Ashby", status: "not_connected", connectVersion: CONNECT_PLATFORM_VERSION, providerVersion: "—" }
  );

  return cards;
}

export async function loadSyncHistory(connectionId: string, limit = 50) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { syncLogs: [] as Record<string, unknown>[], checkpoints: [] as Record<string, unknown>[] };
  }
  const { admin } = await import("@/lib/supabase-admin");

  const { data: syncLogs } = await admin
    .from("connect_sync_log")
    .select("*")
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: checkpoints } = await admin
    .from("connect_sync_checkpoints")
    .select("*")
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { syncLogs: syncLogs ?? [], checkpoints: checkpoints ?? [] };
}

export async function loadEventHistory(connectionId: string, employerAccountId: string, limit = 100) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { events: [] as Record<string, unknown>[], webhooks: [] as Record<string, unknown>[], employerAccountId };
  }
  const { admin } = await import("@/lib/supabase-admin");

  const { data: events } = await admin
    .from("connect_event_store")
    .select("id, correlation_id, event_type, provider_event_type, aggregate_type, aggregate_id, occurred_at, recorded_at, payload, metadata, connection_id")
    .eq("connection_id", connectionId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  const { data: webhooks } = await admin
    .from("connect_webhook_log")
    .select("id, provider_event, universal_event, status, correlation_id, created_at, error_message")
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { events: events ?? [], webhooks: webhooks ?? [], employerAccountId };
}

export async function loadFailedWebhooks(connectionId: string, limit = 50) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const { admin } = await import("@/lib/supabase-admin");

  const { data } = await admin
    .from("connect_webhook_log")
    .select("*")
    .eq("connection_id", connectionId)
    .in("status", ["failed", "dead_letter"])
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
