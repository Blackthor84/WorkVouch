import { describe, expect, it, beforeEach } from "vitest";
import {
  ConnectEventStore,
  InMemoryEventStoreRepository,
  ATS_EVENT_TYPES,
  WORKFLOW_EVENT_TYPES,
  HiringMetricsCalculator,
  HiringMetricsAggregator,
  HiringMetricsEngine,
  InMemoryHiringMetricsRepository,
  LifecycleObservability,
} from "@/lib/integrations";
import { CONNECT_PLATFORM_VERSION } from "@/lib/integrations/connect/version";

describe("WorkVouch Connect — Sprint 8A Hiring Intelligence", () => {
  let eventStore: ConnectEventStore;
  let engine: HiringMetricsEngine;
  let calculator: HiringMetricsCalculator;

  async function seedEvent(input: {
    eventType: string;
    candidateId: string;
    employerId?: string;
    occurredAt: string;
    payload?: Record<string, unknown>;
    providerEventType?: string;
  }) {
    return eventStore.appendEvent({
      correlationId: "corr-metrics",
      provider: "greenhouse",
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: input.employerId ?? "employer-1",
      connectionId: "conn-1",
      aggregateType: "candidate",
      aggregateId: input.candidateId,
      eventType: input.eventType,
      providerEventType: input.providerEventType,
      payload: input.payload ?? {},
      occurredAt: input.occurredAt,
    });
  }

  beforeEach(() => {
    eventStore = new ConnectEventStore(new InMemoryEventStoreRepository());
    calculator = new HiringMetricsCalculator();
    engine = new HiringMetricsEngine({
      eventStore,
      repository: new InMemoryHiringMetricsRepository(),
      lifecycleObservability: new LifecycleObservability(),
    });
  });

  it("builds candidate funnel timeline with stage timings", async () => {
    await seedEvent({
      eventType: ATS_EVENT_TYPES.CandidateCreated,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T10:00:00.000Z",
    });
    await seedEvent({
      eventType: WORKFLOW_EVENT_TYPES.InvitationSent,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T10:15:00.000Z",
      payload: { source: "automation" },
      providerEventType: "lifecycle_orchestration",
    });
    await seedEvent({
      eventType: WORKFLOW_EVENT_TYPES.InvitationAccepted,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T12:00:00.000Z",
    });

    const events = await eventStore.loadTimeline({ companyId: "employer-1" });
    const timelines = calculator.buildCandidateTimelines(events);

    expect(timelines).toHaveLength(1);
    expect(timelines[0].stages.candidate_imported).toBeDefined();
    expect(timelines[0].stages.invitation_sent).toBeDefined();
    expect(timelines[0].stages.invitation_accepted).toBeDefined();
    expect(timelines[0].automated).toBe(true);

    const importToInvite = timelines[0].stageTimings.find(
      (t) => t.from === "candidate_imported" && t.to === "invitation_sent"
    );
    expect(importToInvite?.durationMs).toBe(15 * 60 * 1000);
  });

  it("calculates core metrics from event store", async () => {
    await seedEvent({
      eventType: ATS_EVENT_TYPES.ApplicationCreated,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T10:00:00.000Z",
    });
    await seedEvent({
      eventType: WORKFLOW_EVENT_TYPES.InvitationSent,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T10:30:00.000Z",
      providerEventType: "lifecycle_orchestration",
    });
    await seedEvent({
      eventType: WORKFLOW_EVENT_TYPES.InvitationAccepted,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T11:00:00.000Z",
    });

    await seedEvent({
      eventType: ATS_EVENT_TYPES.ApplicationCreated,
      candidateId: "cand-2",
      occurredAt: "2026-08-02T10:00:00.000Z",
    });
    await seedEvent({
      eventType: WORKFLOW_EVENT_TYPES.InvitationSent,
      candidateId: "cand-2",
      occurredAt: "2026-08-02T10:20:00.000Z",
      providerEventType: "lifecycle_orchestration",
    });

    const events = await eventStore.loadTimeline({ companyId: "employer-1" });
    const metrics = calculator.calculate(events);

    expect(metrics.sampleSize).toBe(2);
    expect(metrics.core.importToInvitationMs).toBeGreaterThan(0);
    expect(metrics.core.invitationAcceptanceRate).toBe(0.5);
    expect(metrics.roi.candidatesProcessedAutomatically).toBeGreaterThan(0);
    expect(metrics.roi.hoursSaved).toBeGreaterThan(0);
  });

  it("aggregates metrics by job dimension", async () => {
    await seedEvent({
      eventType: ATS_EVENT_TYPES.CandidateCreated,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T10:00:00.000Z",
      payload: { universalModel: { application: { jobExternalId: "job-eng" } } },
    });

    const events = await eventStore.loadTimeline({ companyId: "employer-1" });
    const aggregator = new HiringMetricsAggregator();
    const byJob = aggregator.aggregateByLevel(events, "job");

    expect(byJob.size).toBeGreaterThan(0);
  });

  it("generates and retrieves metrics snapshots", async () => {
    await seedEvent({
      eventType: ATS_EVENT_TYPES.CandidateCreated,
      candidateId: "cand-1",
      occurredAt: new Date().toISOString(),
    });

    const snapshot = await engine.captureSnapshot({
      employerAccountId: "employer-1",
      period: "30d",
    });

    expect(snapshot.metrics.sampleSize).toBe(1);
    expect(snapshot.period).toBe("30d");

    const listed = await engine.listSnapshots({ employerAccountId: "employer-1", period: "30d" });
    expect(listed.length).toBe(1);
  });

  it("computes reference response time", async () => {
    await seedEvent({
      eventType: WORKFLOW_EVENT_TYPES.ReferenceRequested,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T10:00:00.000Z",
    });
    await seedEvent({
      eventType: WORKFLOW_EVENT_TYPES.ReferenceReceived,
      candidateId: "cand-1",
      occurredAt: "2026-08-01T11:00:00.000Z",
    });

    const metrics = await engine.computeMetrics({
      employerAccountId: "employer-1",
      period: "lifetime",
    });

    expect(metrics.funnelCounts.references_requested).toBe(1);
    expect(metrics.funnelCounts.references_completed).toBe(1);
    expect(metrics.core.averageReferenceResponseMs).toBe(3_600_000);
  });
});
