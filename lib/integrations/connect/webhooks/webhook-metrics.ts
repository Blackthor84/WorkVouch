/** In-memory webhook delivery metrics — reset on process restart. */
export interface WebhookMetricsSnapshot {
  deliverySuccess: number;
  deliveryFailure: number;
  validationFailures: number;
  duplicates: number;
  retries: number;
  deadLetterCount: number;
  averageLatencyMs: number;
  queueDepth: number;
  projectionLagMs: number;
  lastUpdatedAt: string;
}

export class WebhookMetrics {
  private deliverySuccess = 0;
  private deliveryFailure = 0;
  private validationFailures = 0;
  private duplicates = 0;
  private retries = 0;
  private deadLetterCount = 0;
  private queueDepth = 0;
  private projectionLagMs = 0;
  private latencySum = 0;
  private latencyCount = 0;

  recordDelivery(success: boolean, latencyMs: number): void {
    if (success) this.deliverySuccess += 1;
    else this.deliveryFailure += 1;
    this.latencySum += latencyMs;
    this.latencyCount += 1;
  }

  recordValidationFailure(): void {
    this.validationFailures += 1;
  }

  recordDuplicate(): void {
    this.duplicates += 1;
  }

  recordRetry(): void {
    this.retries += 1;
  }

  recordDeadLetter(): void {
    this.deadLetterCount += 1;
  }

  setQueueDepth(depth: number): void {
    this.queueDepth = depth;
  }

  setProjectionLagMs(lagMs: number): void {
    this.projectionLagMs = lagMs;
  }

  getSnapshot(): WebhookMetricsSnapshot {
    return {
      deliverySuccess: this.deliverySuccess,
      deliveryFailure: this.deliveryFailure,
      validationFailures: this.validationFailures,
      duplicates: this.duplicates,
      retries: this.retries,
      deadLetterCount: this.deadLetterCount,
      averageLatencyMs:
        this.latencyCount > 0 ? Math.round(this.latencySum / this.latencyCount) : 0,
      queueDepth: this.queueDepth,
      projectionLagMs: this.projectionLagMs,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}
