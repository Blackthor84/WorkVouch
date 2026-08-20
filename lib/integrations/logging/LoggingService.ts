import type { IntegrationLogEntry, LogContext, LogLevel } from "../types/logging";

export interface LoggingService {
  log(entry: IntegrationLogEntry): void;
  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  error(message: string, context?: LogContext, metadata?: Record<string, unknown>): void;
  getEntries(limit?: number): IntegrationLogEntry[];
  clear(): void;
}

export type LogSink = (entry: IntegrationLogEntry) => void;

export class StructuredLoggingService implements LoggingService {
  private entries: IntegrationLogEntry[] = [];
  private readonly maxEntries: number;
  private readonly sink?: LogSink;

  constructor(options?: { maxEntries?: number; sink?: LogSink }) {
    this.maxEntries = options?.maxEntries ?? 1000;
    this.sink = options?.sink;
  }

  log(entry: IntegrationLogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    this.sink?.(entry);
  }

  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.write("debug", message, context, metadata);
  }

  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.write("info", message, context, metadata);
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.write("warn", message, context, metadata);
  }

  error(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.write("error", message, context, metadata);
  }

  getEntries(limit?: number): IntegrationLogEntry[] {
    if (limit === undefined) return [...this.entries];
    return this.entries.slice(-limit);
  }

  clear(): void {
    this.entries = [];
  }

  private write(
    level: LogLevel,
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level,
      provider: context?.provider ?? "platform",
      correlationId: context?.correlationId ?? "unknown",
      companyId: context?.companyId,
      event: context?.event ?? message,
      result: level === "error" ? "failure" : "success",
      error: level === "error" ? message : undefined,
      metadata,
    });
  }
}
