import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ConnectEventStore,
  InMemoryEventStoreRepository,
  InMemoryProjectionRepository,
  ProjectionEngine,
  CONNECT_PLATFORM_VERSION,
  isConnectVersionCompatible,
  validateProviderManifestVersion,
} from "@/lib/integrations/connect";
import { GREENHOUSE_MANIFEST } from "@/lib/integrations/providers/greenhouse/config/manifest";

describe("WorkVouch Connect Event Store — Sprint 4", () => {
  let eventStore: ConnectEventStore;
  let projections: ProjectionEngine;
  let repo: InMemoryEventStoreRepository;

  beforeEach(() => {
    repo = new InMemoryEventStoreRepository();
    eventStore = new ConnectEventStore(repo);
    projections = new ProjectionEngine(eventStore, new InMemoryProjectionRepository());
  });

  afterEach(() => {
    repo.clear();
  });

  it("appends immutable events with monotonic sequence numbers", async () => {
    const first = await eventStore.appendEvent({
      correlationId: "corr-1",
      provider: "greenhouse",
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: "employer-1",
      connectionId: "conn-1",
      aggregateType: "candidate",
      aggregateId: "12345",
      eventType: "ats.candidate.created",
      providerEventType: "candidate_created",
      payload: { email: "jane@example.com" },
    });

    const second = await eventStore.appendEvent({
      correlationId: "corr-2",
      provider: "greenhouse",
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: "employer-1",
      connectionId: "conn-1",
      aggregateType: "candidate",
      aggregateId: "12345",
      eventType: "ats.candidate.updated",
      providerEventType: "candidate_updated",
      payload: { fullName: "Jane Chen" },
    });

    expect(first.sequenceNumber).toBe(1);
    expect(second.sequenceNumber).toBe(2);
    expect(first.id).not.toBe(second.id);
  });

  it("deduplicates events by idempotency key", async () => {
    const input = {
      correlationId: "corr-dup",
      provider: "greenhouse" as const,
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: "employer-1",
      aggregateType: "candidate" as const,
      aggregateId: "999",
      eventType: "ats.candidate.created",
      payload: {},
      idempotencyKey: "greenhouse:candidate_created:999:ts1",
    };
    const a = await eventStore.appendEvent(input);
    const b = await eventStore.appendEvent(input);
    expect(a.id).toBe(b.id);
    expect(repo.size()).toBe(1);
  });

  it("loads stream in sequence order for aggregate replay", async () => {
    for (let i = 1; i <= 3; i += 1) {
      await eventStore.appendEvent({
        correlationId: `corr-${i}`,
        provider: "greenhouse",
        providerVersion: "1.0.0",
        connectVersion: CONNECT_PLATFORM_VERSION,
        companyId: "employer-1",
        aggregateType: "candidate",
        aggregateId: "555",
        eventType: i === 1 ? "ats.candidate.created" : "ats.candidate.updated",
        payload: { step: i },
      });
    }

    const stream = await eventStore.loadStream({ aggregateType: "candidate", aggregateId: "555" });
    expect(stream.map((e) => e.sequenceNumber)).toEqual([1, 2, 3]);
  });

  it("projects current candidate state from event history", async () => {
    await eventStore.appendEvent({
      correlationId: "c1",
      provider: "greenhouse",
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: "employer-1",
      aggregateType: "candidate",
      aggregateId: "777",
      eventType: "ats.candidate.created",
      payload: {
        entity: {
          candidate: {
            externalId: "777",
            email: "hire@example.com",
            fullName: "Alex Hire",
            applicationStatus: "applied",
          },
        },
      },
    });

    await eventStore.appendEvent({
      correlationId: "c2",
      provider: "greenhouse",
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: "employer-1",
      aggregateType: "candidate",
      aggregateId: "777",
      eventType: "ats.candidate.hired",
      payload: {
        entity: {
          candidate: { externalId: "777", applicationStatus: "hired" },
        },
      },
    });

    const projection = await projections.projectCandidate("777");
    expect(projection.state.applicationStatus).toBe("hired");
    expect(projection.state.email).toBe("hire@example.com");
    expect(projection.sequenceNumber).toBe(2);
  });

  it("replays stream in dry-run without mutating store", async () => {
    await eventStore.appendEvent({
      correlationId: "r1",
      provider: "greenhouse",
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: "employer-1",
      aggregateType: "job",
      aggregateId: "111",
      eventType: "ats.job.created",
      payload: { entity: { job: { externalId: "111", title: "Engineer", status: "open" } } },
    });

    const before = repo.size();
    const replay = await eventStore.replayStream("job", "111", { dryRun: true });
    expect(replay.dryRun).toBe(true);
    expect(replay.events).toHaveLength(1);
    expect(repo.size()).toBe(before);
  });

  it("loads timeline by correlation id", async () => {
    await eventStore.appendEvent({
      correlationId: "timeline-corr",
      provider: "greenhouse",
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: "employer-1",
      aggregateType: "candidate",
      aggregateId: "1",
      eventType: "ats.candidate.created",
      payload: {},
    });
    await eventStore.appendEvent({
      correlationId: "timeline-corr",
      provider: "greenhouse",
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: "employer-1",
      aggregateType: "candidate",
      aggregateId: "1",
      eventType: "ats.candidate.updated",
      payload: {},
    });

    const timeline = await eventStore.loadTimeline({ correlationId: "timeline-corr" });
    expect(timeline).toHaveLength(2);
  });

  it("validates provider connect version compatibility", () => {
    const check = isConnectVersionCompatible(CONNECT_PLATFORM_VERSION, GREENHOUSE_MANIFEST);
    expect(check.compatible).toBe(true);

    const manifest = validateProviderManifestVersion(GREENHOUSE_MANIFEST);
    expect(manifest.valid).toBe(true);
  });

  it("reconstructs full candidate history from event store only", async () => {
    const aggregateId = "history-999";
    const eventTypes = [
      "ats.candidate.created",
      "ats.candidate.updated",
      "ats.candidate.moved",
      "ats.offer.accepted",
      "ats.candidate.hired",
    ];

    for (const [index, eventType] of eventTypes.entries()) {
      await eventStore.appendEvent({
        correlationId: `hist-${index}`,
        provider: "greenhouse",
        providerVersion: "1.0.0",
        connectVersion: CONNECT_PLATFORM_VERSION,
        companyId: "employer-1",
        aggregateType: "candidate",
        aggregateId,
        eventType,
        payload: {
          entity: {
            candidate: {
              externalId: aggregateId,
              applicationStatus:
                eventType === "ats.candidate.hired" ? "hired" : index === 0 ? "applied" : "interview",
            },
          },
        },
      });
    }

    const history = await eventStore.loadStream({ aggregateType: "candidate", aggregateId });
    const projection = await projections.projectCandidate(aggregateId);

    expect(history).toHaveLength(5);
    expect(projection.state.applicationStatus).toBe("hired");
    expect(projection.state.eventsApplied).toBe(5);
  });
});
