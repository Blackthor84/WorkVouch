import type { AtsApplication } from "../../../core/models/Application";
import type { AtsCandidate } from "../../../core/models/Candidate";
import type { AtsJob } from "../../../core/models/Job";
import { ATS_EVENT_TYPES } from "../../../core/events/ats-event-types";
import type { ConnectionManager } from "../../../connect/connection/connection-manager";
import type { ConnectEventStore } from "../../../connect/event-store/connect-event-store";
import type { ProjectionEngine } from "../../../connect/projection/projection-engine";
import type { CandidateMapRepository } from "../../../connect/persistence/repositories/candidate-map-repository";
import type { JobMapRepository } from "../../../connect/persistence/repositories/job-map-repository";
import type { SyncLogRepository } from "../../../connect/persistence/repositories/sync-log-repository";
import type { SyncCursorManager } from "../../../connect/sync/sync-cursor-manager";
import type { SyncImportMode } from "../../../connect/sync/types";
import { CONNECT_PLATFORM_VERSION } from "../../../connect/version";
import { createCorrelationId } from "../../../utils/correlation";
import type { HarvestClient } from "../api/harvest-client";
import type { GreenhouseCandidate } from "../models";
import { mapGreenhouseApplication } from "../mappers/applicationMapper";
import { mapGreenhouseCandidate } from "../mappers/candidateMapper";
import { mapCustomFieldDefinitions } from "../mappers/customFieldMapper";
import { mapGreenhouseJob } from "../mappers/jobMapper";
import { GREENHOUSE_MANIFEST } from "../config/manifest";

export interface HarvestImportOptions {
  connectionId: string;
  employerAccountId: string;
  maxPages?: number;
  perPage?: number;
  mode?: SyncImportMode;
}

export interface HarvestImportResult {
  correlationId: string;
  mode: SyncImportMode;
  status: "completed" | "partial" | "failed";
  jobsImported: number;
  candidatesImported: number;
  applicationsImported: number;
  candidateEmploymentsImported: number;
  customFieldsCataloged: number;
  eventsStored: number;
  durationMs: number;
  errors: string[];
  dryRun: boolean;
  cursorAdvanced: boolean;
  paginationTruncated: boolean;
  syncLogWritten: boolean;
}

export interface HarvestImportDeps {
  harvest: HarvestClient;
  connections: ConnectionManager;
  eventStore: ConnectEventStore;
  projections: ProjectionEngine;
  jobMap: JobMapRepository;
  candidateMap: CandidateMapRepository;
  syncLog: SyncLogRepository;
  cursorManager?: SyncCursorManager;
}

/** Greenhouse Harvest V3 import with cursor pagination + WorkVouch sync cursor. */
export class HarvestImportService {
  constructor(private readonly deps: HarvestImportDeps) {}

  async importAll(options: HarvestImportOptions): Promise<HarvestImportResult> {
    const mode =
      options.mode ??
      (await this.deps.connections.resolveSyncMode(options.connectionId)) ??
      "incremental";

    if (mode === "full") {
      return this.runImport(options, mode, { forceFull: true });
    }
    if (mode === "incremental") {
      return this.runImport(options, mode, { incremental: true });
    }
    if (mode === "resume" || mode === "recovery") {
      return this.runImport(options, mode, { incremental: true, resume: true });
    }
    if (mode === "dry_run") {
      return this.runImport(options, mode, { incremental: true, dryRun: true });
    }
    return this.runImport(options, mode, {});
  }

  async importIncremental(options: HarvestImportOptions): Promise<HarvestImportResult> {
    return this.importAll({ ...options, mode: "incremental" });
  }

  async importFull(options: HarvestImportOptions): Promise<HarvestImportResult> {
    return this.importAll({ ...options, mode: "full" });
  }

  async resumeImport(options: HarvestImportOptions): Promise<HarvestImportResult> {
    return this.importAll({ ...options, mode: "resume" });
  }

  async recoveryImport(options: HarvestImportOptions): Promise<HarvestImportResult> {
    if (this.deps.cursorManager) {
      await this.deps.cursorManager.recover(options.connectionId);
    }
    return this.importAll({ ...options, mode: "recovery" });
  }

  async dryRunImport(options: HarvestImportOptions): Promise<HarvestImportResult> {
    return this.importAll({ ...options, mode: "dry_run" });
  }

  private async runImport(
    options: HarvestImportOptions,
    mode: SyncImportMode,
    flags: { forceFull?: boolean; incremental?: boolean; resume?: boolean; dryRun?: boolean }
  ): Promise<HarvestImportResult> {
    const started = Date.now();
    const correlationId = createCorrelationId("import");
    const errors: string[] = [];
    let jobsImported = 0;
    let candidatesImported = 0;
    let applicationsImported = 0;
    let candidateEmploymentsImported = 0;
    let customFieldsCataloged = 0;
    let eventsStored = 0;
    let paginationTruncated = false;
    const dryRun = flags.dryRun === true;

    await this.deps.connections.initializeCursor(options.connectionId, "greenhouse", GREENHOUSE_MANIFEST.version);
    if (this.deps.cursorManager) {
      await this.deps.cursorManager.beginSync(options.connectionId, mode);
    }

    const tokens = await this.deps.connections.getTokens(options.connectionId);
    if (!tokens) {
      errors.push("No tokens available for connection");
      const syncLogWritten = await this.recordSyncOutcome({
        options,
        mode,
        correlationId,
        started,
        status: "failed",
        errors,
        jobsImported,
        candidatesImported,
        applicationsImported,
        candidateEmploymentsImported,
        customFieldsCataloged,
        eventsStored,
        paginationTruncated,
        dryRun,
      });
      return this.buildResult({
        correlationId,
        mode,
        status: "failed",
        started,
        errors,
        jobsImported,
        candidatesImported,
        applicationsImported,
        candidateEmploymentsImported,
        customFieldsCataloged,
        eventsStored,
        dryRun,
        cursorAdvanced: false,
        paginationTruncated,
        syncLogWritten,
      });
    }

    if (this.deps.connections.isTokenExpired(tokens.expiresAt) && tokens.refreshToken) {
      errors.push("Token expired — refresh required before import");
      const syncLogWritten = await this.recordSyncOutcome({
        options,
        mode,
        correlationId,
        started,
        status: "failed",
        errors,
        jobsImported,
        candidatesImported,
        applicationsImported,
        candidateEmploymentsImported,
        customFieldsCataloged,
        eventsStored,
        paginationTruncated,
        dryRun,
      });
      return this.buildResult({
        correlationId,
        mode,
        status: "failed",
        started,
        errors,
        jobsImported,
        candidatesImported,
        applicationsImported,
        candidateEmploymentsImported,
        customFieldsCataloged,
        eventsStored,
        dryRun,
        cursorAdvanced: false,
        paginationTruncated,
        syncLogWritten,
      });
    }

    const cursor = await this.deps.connections.getCursor(options.connectionId);
    const updatedAfter =
      flags.forceFull || !flags.incremental
        ? undefined
        : cursor?.providerCursor.updatedAfter ?? cursor?.lastSuccessfulSync;

    const maxPages = options.maxPages ?? 5;
    const perPage = options.perPage ?? 100;
    const accessToken = tokens.accessToken;

    const providerCursors = (cursor?.providerCursor ?? {}) as Record<string, string | undefined>;
    const candidatesByExternalId = new Map<string, GreenhouseCandidate>();
    const persistedCandidateIds = new Set<string>();

    try {
      const jobsPage = await this.deps.harvest.listJobs(accessToken, {
        perPage,
        updatedAfter,
        maxPages,
        startUrl: flags.resume ? providerCursors.jobsNextUrl : undefined,
      });
      paginationTruncated = paginationTruncated || jobsPage.truncated;
      for (const raw of jobsPage.items) {
        try {
          const universal = mapGreenhouseJob(raw);
          if (!dryRun) await this.persistJob(options, universal, correlationId);
          jobsImported += 1;
          eventsStored += dryRun ? 0 : 1;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "Job import failed");
        }
      }

      const candidatesPage = await this.deps.harvest.listCandidates(accessToken, {
        perPage,
        updatedAfter,
        maxPages,
        startUrl: flags.resume ? providerCursors.candidatesNextUrl : undefined,
      });
      paginationTruncated = paginationTruncated || candidatesPage.truncated;
      for (const raw of candidatesPage.items) {
        candidatesByExternalId.set(String(raw.id), raw);
        try {
          const universal = mapGreenhouseCandidate(raw);
          if (!dryRun) await this.persistCandidate(options, universal, correlationId);
          persistedCandidateIds.add(universal.externalId);
          candidatesImported += 1;
          eventsStored += dryRun ? 0 : 1;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "Candidate import failed");
        }
      }

      const applicationsPage = await this.deps.harvest.listApplications(accessToken, {
        perPage,
        updatedAfter,
        maxPages,
        startUrl: flags.resume ? providerCursors.applicationsNextUrl : undefined,
      });
      paginationTruncated = paginationTruncated || applicationsPage.truncated;
      for (const raw of applicationsPage.items) {
        try {
          const universal = mapGreenhouseApplication(raw);
          if (!dryRun) {
            const candidatePersisted = await this.persistApplication(options, universal, correlationId, {
              accessToken,
              dryRun,
              candidatesByExternalId,
              persistedCandidateIds,
            });
            if (candidatePersisted) {
              candidatesImported += 1;
              eventsStored += 1;
            }
          }
          applicationsImported += 1;
          eventsStored += dryRun ? 0 : 1;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "Application import failed");
        }
      }

      const employmentsPage = await this.deps.harvest.listCandidateEmployments(accessToken, {
        perPage,
        updatedAfter,
        maxPages,
      });
      paginationTruncated = paginationTruncated || employmentsPage.truncated;
      candidateEmploymentsImported = employmentsPage.items.length;

      const customFieldsPage = await this.deps.harvest.listCustomFields(accessToken, {
        perPage,
        maxPages: 1,
      });
      const catalog = mapCustomFieldDefinitions(customFieldsPage.items);
      customFieldsCataloged = Object.keys(catalog).length;

      let cursorAdvanced = false;
      if (!dryRun && this.deps.cursorManager) {
        const timeline = await this.deps.eventStore.loadTimeline({ limit: 10_000 });
        const connectionEventCount = timeline.filter((e) => e.connectionId === options.connectionId).length;
        await this.deps.cursorManager.completeSync(options.connectionId, "greenhouse", mode, {
          jobsImported,
          candidatesImported,
          applicationsImported,
          eventsStored,
          durationMs: Date.now() - started,
          correlationId,
          lastSequenceNumber: connectionEventCount,
        });
        await this.deps.connections.updateCursor(options.connectionId, {
          providerCursor: {
            updatedAfter: new Date().toISOString(),
            jobsNextUrl: jobsPage.lastNextUrl ?? undefined,
            candidatesNextUrl: candidatesPage.lastNextUrl ?? undefined,
            applicationsNextUrl: applicationsPage.lastNextUrl ?? undefined,
            employmentsNextUrl: employmentsPage.lastNextUrl ?? undefined,
          },
        });
        cursorAdvanced = true;
      }

      const status = errors.length === 0 ? "completed" : "partial";
      const syncLogWritten = await this.recordSyncOutcome({
        options,
        mode,
        correlationId,
        started,
        status,
        errors,
        jobsImported,
        candidatesImported,
        applicationsImported,
        candidateEmploymentsImported,
        customFieldsCataloged,
        eventsStored,
        paginationTruncated,
        dryRun,
      });

      return this.buildResult({
        correlationId,
        mode,
        status,
        started,
        errors,
        jobsImported,
        candidatesImported,
        applicationsImported,
        candidateEmploymentsImported,
        customFieldsCataloged,
        eventsStored,
        dryRun,
        cursorAdvanced,
        paginationTruncated,
        syncLogWritten,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      errors.push(message);
      if (this.deps.cursorManager) {
        await this.deps.connections.recordCursorError(options.connectionId, message);
      }
      const syncLogWritten = await this.recordSyncOutcome({
        options,
        mode,
        correlationId,
        started,
        status: "failed",
        errors,
        jobsImported,
        candidatesImported,
        applicationsImported,
        candidateEmploymentsImported,
        customFieldsCataloged,
        eventsStored,
        paginationTruncated,
        dryRun,
      });
      return this.buildResult({
        correlationId,
        mode,
        status: "failed",
        started,
        errors,
        jobsImported,
        candidatesImported,
        applicationsImported,
        candidateEmploymentsImported,
        customFieldsCataloged,
        eventsStored,
        dryRun,
        cursorAdvanced: false,
        paginationTruncated,
        syncLogWritten,
      });
    }
  }

  private async recordSyncOutcome(input: {
    options: HarvestImportOptions;
    mode: SyncImportMode;
    correlationId: string;
    started: number;
    status: "completed" | "partial" | "failed";
    errors: string[];
    jobsImported: number;
    candidatesImported: number;
    applicationsImported: number;
    candidateEmploymentsImported: number;
    customFieldsCataloged: number;
    eventsStored: number;
    paginationTruncated: boolean;
    dryRun: boolean;
  }): Promise<boolean> {
    if (input.dryRun) return false;

    await this.deps.syncLog.append({
      connectionId: input.options.connectionId,
      provider: "greenhouse",
      syncType: input.mode,
      externalId: input.correlationId,
      direction: "inbound",
      status: input.status,
      durationMs: Date.now() - input.started,
      metadata: {
        jobsImported: input.jobsImported,
        candidatesImported: input.candidatesImported,
        applicationsImported: input.applicationsImported,
        candidateEmploymentsImported: input.candidateEmploymentsImported,
        customFieldsCataloged: input.customFieldsCataloged,
        eventsStored: input.eventsStored,
        mode: input.mode,
        paginationTruncated: input.paginationTruncated,
        errors: input.errors,
      },
    });

    return true;
  }

  private buildResult(input: {
    correlationId: string;
    mode: SyncImportMode;
    status: "completed" | "partial" | "failed";
    started: number;
    errors: string[];
    jobsImported: number;
    candidatesImported: number;
    applicationsImported: number;
    candidateEmploymentsImported: number;
    customFieldsCataloged: number;
    eventsStored: number;
    dryRun: boolean;
    cursorAdvanced: boolean;
    paginationTruncated: boolean;
    syncLogWritten: boolean;
  }): HarvestImportResult {
    return {
      correlationId: input.correlationId,
      mode: input.mode,
      status: input.status,
      jobsImported: input.jobsImported,
      candidatesImported: input.candidatesImported,
      applicationsImported: input.applicationsImported,
      candidateEmploymentsImported: input.candidateEmploymentsImported,
      customFieldsCataloged: input.customFieldsCataloged,
      eventsStored: input.eventsStored,
      durationMs: Date.now() - input.started,
      errors: input.errors,
      dryRun: input.dryRun,
      cursorAdvanced: input.cursorAdvanced,
      paginationTruncated: input.paginationTruncated,
      syncLogWritten: input.syncLogWritten,
    };
  }

  private async persistJob(options: HarvestImportOptions, job: AtsJob, correlationId: string): Promise<void> {
    await this.deps.jobMap.upsert({
      connectionId: options.connectionId,
      externalJobId: job.externalId,
      jobTitle: job.title,
      status: job.status,
      metadata: job.metadata ?? {},
    });

    await this.deps.eventStore.appendEvent({
      correlationId,
      provider: "greenhouse",
      providerVersion: GREENHOUSE_MANIFEST.version,
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: options.employerAccountId,
      connectionId: options.connectionId,
      aggregateType: "job",
      aggregateId: job.externalId,
      eventType: ATS_EVENT_TYPES.JobCreated,
      providerEventType: "harvest_import",
      payload: { universalModel: { entity: { job } }, source: "harvest_import" },
      idempotencyKey: `greenhouse:import:job:${job.externalId}:${options.connectionId}`,
    });

    await this.deps.projections.projectJob(job.externalId);
  }

  private async persistCandidate(options: HarvestImportOptions, candidate: AtsCandidate, correlationId: string): Promise<void> {
    await this.deps.candidateMap.upsert({
      connectionId: options.connectionId,
      externalCandidateId: candidate.externalId,
      candidateEmail: candidate.email,
      candidateName: candidate.fullName,
      applicationStatus: candidate.applicationStatus,
      metadata: candidate.metadata ?? {},
    });

    await this.deps.eventStore.appendEvent({
      correlationId,
      provider: "greenhouse",
      providerVersion: GREENHOUSE_MANIFEST.version,
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: options.employerAccountId,
      connectionId: options.connectionId,
      aggregateType: "candidate",
      aggregateId: candidate.externalId,
      eventType: ATS_EVENT_TYPES.CandidateCreated,
      providerEventType: "harvest_import",
      payload: { universalModel: { entity: { candidate } }, source: "harvest_import" },
      idempotencyKey: `greenhouse:import:candidate:${candidate.externalId}:${options.connectionId}`,
    });

    await this.deps.projections.projectCandidate(candidate.externalId);
  }

  private async persistApplication(
    options: HarvestImportOptions,
    application: AtsApplication,
    correlationId: string,
    context: {
      accessToken: string;
      dryRun: boolean;
      candidatesByExternalId: Map<string, GreenhouseCandidate>;
      persistedCandidateIds: Set<string>;
    }
  ): Promise<boolean> {
    await this.deps.eventStore.appendEvent({
      correlationId,
      provider: "greenhouse",
      providerVersion: GREENHOUSE_MANIFEST.version,
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: options.employerAccountId,
      connectionId: options.connectionId,
      aggregateType: "application",
      aggregateId: application.externalId,
      eventType: ATS_EVENT_TYPES.ApplicationCreated,
      providerEventType: "harvest_import",
      payload: { universalModel: { entity: { application } }, source: "harvest_import" },
      idempotencyKey: `greenhouse:import:application:${application.externalId}:${options.connectionId}`,
    });

    const candidateExternalId = application.candidateExternalId;
    if (!candidateExternalId || context.dryRun || context.persistedCandidateIds.has(candidateExternalId)) {
      return false;
    }

    const listedCandidate = context.candidatesByExternalId.get(candidateExternalId);
    const rawCandidate =
      listedCandidate ??
      (await this.deps.harvest.getCandidate(context.accessToken, candidateExternalId));
    const universalCandidate = mapGreenhouseCandidate(rawCandidate);
    await this.persistCandidate(options, universalCandidate, correlationId);
    context.persistedCandidateIds.add(candidateExternalId);
    return true;
  }
}
