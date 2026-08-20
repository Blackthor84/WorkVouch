import { randomUUID } from "crypto";
import { nowIso } from "../../utils/correlation";
import type { WorkflowObservabilityRecord } from "./types";

/** Tracks automation triggers, decisions, and workflow execution metrics. */
export class LifecycleObservability {
  private readonly records: WorkflowObservabilityRecord[] = [];
  private automationTriggers = 0;
  private decisionsMade = 0;
  private workflowsSucceeded = 0;
  private workflowsFailed = 0;
  private totalDurationMs = 0;

  record(input: Omit<WorkflowObservabilityRecord, "id" | "recordedAt">): WorkflowObservabilityRecord {
    const row: WorkflowObservabilityRecord = {
      id: randomUUID(),
      ...input,
      recordedAt: nowIso(),
    };
    this.records.push(row);
    this.automationTriggers += 1;
    this.decisionsMade += 1;
    this.totalDurationMs += input.durationMs;
    if (input.workflowResult === "success") this.workflowsSucceeded += 1;
    else if (input.workflowResult === "failure") this.workflowsFailed += 1;
    return { ...row };
  }

  getSnapshot() {
    const count = this.records.length;
    return {
      automationTriggers: this.automationTriggers,
      decisionsMade: this.decisionsMade,
      workflowsSucceeded: this.workflowsSucceeded,
      workflowsFailed: this.workflowsFailed,
      averageExecutionMs: count > 0 ? Math.round(this.totalDurationMs / count) : 0,
      sampleSize: count,
      lastRecordedAt: this.records.at(-1)?.recordedAt,
    };
  }

  listRecent(limit = 50): WorkflowObservabilityRecord[] {
    return this.records.slice(-limit).map((r) => ({ ...r }));
  }

  clear(): void {
    this.records.length = 0;
    this.automationTriggers = 0;
    this.decisionsMade = 0;
    this.workflowsSucceeded = 0;
    this.workflowsFailed = 0;
    this.totalDurationMs = 0;
  }
}
