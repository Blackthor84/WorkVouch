import type { ConfigurationService } from "../config/ConfigurationService";

export class RetryService {
  constructor(private readonly config: ConfigurationService) {}

  getBackoffMs(attemptCount: number): number {
    const schedule = this.config.getConfig().defaultRetryBackoffMs;
    const index = Math.max(0, Math.min(attemptCount - 1, schedule.length - 1));
    return schedule[index] ?? schedule[schedule.length - 1] ?? 1000;
  }

  shouldRetry(attemptCount: number, maxAttempts: number): boolean {
    return attemptCount < maxAttempts;
  }
}
