import { createHash } from "crypto";
import type { ConnectionManager } from "../connection/connection-manager";
import type { WebhookRepository } from "../persistence/repositories/webhook-repository";
import type { DeadLetterQueue } from "../../queue/DeadLetterQueue";
import type { LoggingService } from "../../logging/LoggingService";
import { verifyGreenhouseWebhookSignature, hashWebhookPayload } from "../../providers/greenhouse/auth/webhook-signature";
import { buildIdempotencyKey, parseGreenhouseWebhook } from "../../providers/greenhouse/mappers/webhookMapper";
import { resolveGreenhouseConfig } from "../../providers/greenhouse/config/greenhouse-config";
import type { GreenhouseWebhookProcessor } from "./greenhouse-webhook-processor";
import type { WebhookMetrics } from "./webhook-metrics";
import { nowIso } from "../../utils/correlation";

export interface ReceiveGreenhouseWebhookInput {
  rawBody: string;
  headers: Record<string, string>;
  connectionId?: string;
  webhookSecret?: string;
}

export interface WebhookHandleResult {
  status: number;
  body: Record<string, unknown>;
  accepted: boolean;
  duplicate: boolean;
  processed: boolean;
  correlationId?: string;
  webhookLogId?: string;
}

export interface WebhookServiceDeps {
  connections: ConnectionManager;
  webhooks: WebhookRepository;
  processor: GreenhouseWebhookProcessor;
  deadLetterQueue: DeadLetterQueue;
  logger: LoggingService;
  metrics: WebhookMetrics;
}

/** Orchestrates Greenhouse webhook ingress: verify → dedup → log → process. */
export class WebhookService {
  constructor(private readonly deps: WebhookServiceDeps) {}

  async receiveGreenhouse(input: ReceiveGreenhouseWebhookInput): Promise<WebhookHandleResult> {
    const started = Date.now();
    const normalizedHeaders = Object.fromEntries(
      Object.entries(input.headers).map(([k, v]) => [k.toLowerCase(), v])
    );

    const secret =
      input.webhookSecret ??
      resolveGreenhouseConfig().webhookSecret ??
      process.env.GREENHOUSE_WEBHOOK_SECRET ??
      "";

    const signature =
      normalizedHeaders["signature"] ??
      normalizedHeaders["x-greenhouse-signature"] ??
      normalizedHeaders["x-hub-signature-256"];

    if (!verifyGreenhouseWebhookSignature(input.rawBody, signature, secret)) {
      this.deps.metrics.recordValidationFailure();
      this.deps.metrics.recordDelivery(false, Date.now() - started);
      await this.logRejected(input.rawBody, "Invalid webhook signature");
      return {
        status: 401,
        body: { error: "Invalid webhook signature" },
        accepted: false,
        duplicate: false,
        processed: false,
      };
    }

    let payload: unknown;
    try {
      payload = JSON.parse(input.rawBody);
    } catch {
      this.deps.metrics.recordValidationFailure();
      await this.logRejected(input.rawBody, "Invalid JSON payload");
      return {
        status: 400,
        body: { error: "Invalid JSON payload" },
        accepted: false,
        duplicate: false,
        processed: false,
      };
    }

    const webhook = parseGreenhouseWebhook(payload);
    const idempotencyKey = buildIdempotencyKey(webhook);
    const payloadHash = hashWebhookPayload(input.rawBody);

    const existing = await this.deps.webhooks.getByProviderEventId("greenhouse", idempotencyKey);
    if (existing && existing.status !== "rejected") {
      this.deps.metrics.recordDuplicate();
      this.deps.metrics.recordDelivery(true, Date.now() - started);
      return {
        status: 200,
        body: { accepted: true, duplicate: true, webhookLogId: existing.id },
        accepted: true,
        duplicate: true,
        processed: false,
        webhookLogId: existing.id,
      };
    }

    const connection = await this.resolveConnection(input.connectionId, normalizedHeaders);
    if (!connection) {
      await this.logRejected(input.rawBody, "Connection not found", idempotencyKey, webhook.action);
      return {
        status: 404,
        body: { error: "Connection not found" },
        accepted: false,
        duplicate: false,
        processed: false,
      };
    }

    const logRow = await this.deps.webhooks.append({
      connectionId: connection.connectionId,
      provider: "greenhouse",
      providerEventId: idempotencyKey,
      providerEventType: webhook.action,
      normalizedEventType: webhook.action,
      status: "received",
      payloadHash,
      metadata: { payloadHash, employerAccountId: connection.employerAccountId },
    });

    const result = await this.deps.processor.process({
      rawPayload: payload,
      connectionId: connection.connectionId,
      employerAccountId: connection.employerAccountId,
      correlationId: undefined,
      webhookLogId: logRow.id,
    });

    const finalStatus = result.success ? "processed" : "failed";
    await this.deps.webhooks.updateStatus(logRow.id, finalStatus, nowIso(), result.durationMs);

    if (!result.success) {
      await this.deps.webhooks.updateStatus(logRow.id, "dead_letter", nowIso(), result.durationMs);
    }

    this.deps.metrics.recordDelivery(result.success, Date.now() - started);
    void this.deps.deadLetterQueue.sizeAsync().then((depth) => {
      this.deps.metrics.setQueueDepth(depth);
    });

    return {
      status: 200,
      body: {
        accepted: true,
        duplicate: false,
        processed: result.success,
        correlationId: result.correlationId,
        universalEvent: result.universalEvent,
        webhookLogId: logRow.id,
      },
      accepted: true,
      duplicate: false,
      processed: result.success,
      correlationId: result.correlationId,
      webhookLogId: logRow.id,
    };
  }

  async replayDeadLetter(webhookLogId: string): Promise<WebhookHandleResult> {
    const dlqEvent = await this.deps.deadLetterQueue.replayAsync(webhookLogId);
    if (!dlqEvent) {
      return {
        status: 404,
        body: { error: "Dead letter event not found" },
        accepted: false,
        duplicate: false,
        processed: false,
      };
    }

    this.deps.metrics.recordRetry();
    const payload = (dlqEvent.payload as { rawPayload?: unknown }).rawPayload;
    if (!payload || !dlqEvent.connectionId || !dlqEvent.employerAccountId) {
      return {
        status: 400,
        body: { error: "Invalid dead letter payload" },
        accepted: false,
        duplicate: false,
        processed: false,
      };
    }

    const result = await this.deps.processor.process({
      rawPayload: payload,
      connectionId: dlqEvent.connectionId,
      employerAccountId: dlqEvent.employerAccountId,
      webhookLogId,
    });

    return {
      status: result.success ? 200 : 500,
      body: { replayed: result.success, correlationId: result.correlationId },
      accepted: result.success,
      duplicate: false,
      processed: result.success,
      correlationId: result.correlationId,
      webhookLogId,
    };
  }

  getMetrics(): ReturnType<WebhookMetrics["getSnapshot"]> {
    void this.deps.deadLetterQueue.sizeAsync().then((depth) => {
      this.deps.metrics.setQueueDepth(depth);
    });
    return this.deps.metrics.getSnapshot();
  }

  private async resolveConnection(
    connectionId?: string,
    headers?: Record<string, string>
  ): Promise<{ connectionId: string; employerAccountId: string } | null> {
    const resolvedId =
      connectionId ??
      headers?.["x-workvouch-connection-id"] ??
      headers?.["x-connection-id"];

    if (resolvedId) {
      const summary = await this.deps.connections.getConnection(resolvedId);
      if (summary && summary.status === "connected") {
        return { connectionId: summary.connectionId, employerAccountId: summary.employerAccountId };
      }
    }

    const orgId = headers?.["x-greenhouse-organization-id"];
    if (orgId && resolvedId) {
      const summary = await this.deps.connections.getConnection(resolvedId);
      if (summary?.providerAccountId === orgId) {
        return { connectionId: summary.connectionId, employerAccountId: summary.employerAccountId };
      }
    }

    return null;
  }

  private async logRejected(
    rawBody: string,
    reason: string,
    providerEventId?: string,
    action?: string
  ): Promise<void> {
    try {
      const hash = createHash("sha256").update(rawBody).digest("hex").slice(0, 16);
      await this.deps.webhooks.append({
        provider: "greenhouse",
        providerEventId: providerEventId ?? `rejected:${hash}`,
        providerEventType: action ?? "unknown",
        status: "rejected",
        payloadHash: hashWebhookPayload(rawBody),
        metadata: { reason },
      });
    } catch {
      // best-effort logging
    }
    this.deps.logger.warn("Webhook rejected", {
      provider: "greenhouse",
      metadata: { reason },
    });
  }
}
