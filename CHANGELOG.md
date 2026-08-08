# Changelog

All notable changes to the WorkVouch Connect integration platform are documented here.

## Sprint 8B — Connect Diagnostic Bundle

- Added Diagnostic Bundle system (`DiagnosticBundleService`, `BundleBuilder`, `BundleRedactor`, `BundleValidator`, `BundleExporter`)
- Portable support bundle: connection metadata, health, sync cursor/history, events, audit, replay refs, metrics
- Automatic secret redaction (OAuth tokens, API keys, Bearer/JWT, PII email mask) with redaction audit trail
- Export formats: ZIP (default), JSON, Markdown with checksums and README.md support summary
- Developer API: `generateDiagnosticBundle()`, `downloadDiagnosticBundle()`, `validateDiagnosticBundle()`, `previewDiagnosticBundle()`
- Employer API: `GET /api/employer/integrations/connections/[connectionId]/diagnostic-bundle`
- Employer UI: Download Diagnostic Bundle on provider details with progress, size, and timestamp
- Wired `runtime.diagnosticBundles` on Connect runtime
- 8 new diagnostic bundle tests

## Sprint 8A — Hiring Intelligence & Business Metrics

- Added Hiring Intelligence Engine (`HiringMetricsEngine`, calculator, aggregator, snapshot service, scheduler)
- Business funnel metrics: import → invite → accept → verify → references → trust → complete
- Core metrics: invitation rates, verification time, reference time, automation success/failure
- Advanced metrics: import success, replay rate, manual override, sync/recovery success, queue wait
- ROI metrics: hours saved, manual tasks eliminated, automation coverage
- Aggregation: per candidate, job, department, employer, provider, connection; day/week/month periods
- Historical trends: 7d, 30d, 90d, YTD, lifetime with period comparison
- Metrics snapshots in `connect_hiring_metrics_snapshots`; event store as single source of truth
- Employer API: `GET/POST /api/employer/integrations/intelligence`
- Wired `runtime.hiringMetrics` on Connect runtime
- 5 new hiring intelligence tests (111 total integration tests passing)

## Sprint 8 — Employer Integration Experience

- Added employer integration portal at `/employer/integrations/` (dashboard, wizard, provider details, sync, events, health, settings, replay)
- Added authenticated employer API routes under `/api/employer/integrations/`
- Connection wizard: 6-step Greenhouse OAuth flow with import preview and automation setup
- Integration dashboard: health score, sync stats, automation status, sync now action
- Health dashboard: component-level health, webhook metrics, lifecycle observability
- Event explorer: correlation ID search, event store + webhook log timeline
- Replay center: simulate and live replay failed webhooks
- Automation settings UI: triggers, job/department/location filters, delay
- OAuth callback redirects to employer portal; sidebar Integrations link added
- 3 new employer portal tests (106 total integration tests passing)

## Sprint 7 — Candidate Lifecycle Orchestration

- Added Candidate Lifecycle Engine (`CandidateLifecycleEngine`, `WorkflowEngine`, `AutomationRuleEvaluator`, `DecisionEngine`)
- Automation rules: invite triggers (application, phone screen, final interview, offer, hire, manual), job/department/location/employment filters
- Lifecycle states: imported through archived/cancelled (12 states)
- Workflow actions: invite, reminder, cancel, archive, verification, references, trust refresh, AI summary placeholder
- Internal invitation queue with pending/scheduled/sent/failed/retry/cancelled/expired statuses
- Business events: VerificationRequested, ReferenceRequested, InvitationSent, WorkflowCompleted, WorkflowCancelled
- LifecycleObservability: automation triggers, decisions, rule matched, execution time, workflow result
- Database migration: connect_lifecycle_state, connect_invitation_queue, connect_workflow_log
- Wired into Connect runtime via EventDispatcher subscription
- 8 new lifecycle tests (103 total integration tests passing)

## Sprint 6 — Live Webhooks & Real-Time Sync

- Added `POST /api/integrations/v1/webhooks/greenhouse` with HMAC-SHA256 signature verification
- Added `GET /api/integrations/v1/connect/greenhouse/callback` OAuth callback route
- Implemented WebhookService, GreenhouseWebhookProcessor, WebhookMetrics
- Real-time pipeline: webhook → validate → translate → event store → projection → audit
- Greenhouse receiveWebhook with signature validation and 12 supported event types
- Idempotency via connect_webhook_log + event store keys; duplicate detection
- Dead letter queue for failed webhooks with replay support
- Sync cursor updates on webhook (lastWebhookProcessed, entity timestamps)
- 9 new webhook tests (95 total integration tests passing)

## Sprint 6A — Incremental Sync Cursor Engine

- Added provider-agnostic Sync Cursor Engine (`SyncCursorService`, `SyncCursorManager`, `SyncCursorValidator`, `SyncCheckpoint`)
- Added `connect_sync_cursor` and `connect_sync_checkpoints` database tables
- Cursor operations: initialize, advance, reset, archive, clone, validate, compare
- Checkpoint system with performance metrics after each successful sync
- HarvestImportService: full, incremental, resume, recovery, and dry-run import modes
- HarvestClient: `updated_after` query param for incremental API calls
- ConnectionManager cursor API: getCursor, updateCursor, resetCursor, scheduleNextSync, validateCursor
- ConnectHealthService: cursor health component (healthy, behind, missing, corrupted, expired)
- ReplayService: replayFromCursor, replaySinceCheckpoint, replaySinceTimestamp, replayUntilCursor
- 11 new sync cursor tests (86 total integration tests passing)

## Sprint 5 — First Live Greenhouse Connection

- Added persistent encrypted OAuth token storage
- Added ConnectionManager (create, reconnect, disconnect, refresh, health, test)
- Extended HarvestClient for jobs, candidates, applications, users
- Added HarvestImportService with event store + projection persistence
- Added ConnectHealthService (internal health dashboard)
- Added SnapshotService (automatic every 50 events)
- Added ConnectRecoveryService (OAuth refresh, backoff, reconnect)
- Added Connect runtime bootstrap and integration API routes

## Sprint 4 — Event Store & Persistence

- Added immutable append-only `connect_event_store` and supporting Connect tables
- Implemented Event Store service (append, load stream, load timeline, replay, snapshot)
- Implemented Projection Engine for candidate, job, and connection read models
- Added repository layer with in-memory and Supabase implementations
- Integrated Replay and Audit services with Event Store
- Added Connect platform versioning (`CONNECT_PLATFORM_VERSION`) and provider manifest validation
- Added persistence integration tests (62+ total integration tests)

## Sprint 3B-3 — WorkVouch Connect Developer Platform

- Added WorkVouch Connect platform facade
- Added Event Inspector, Replay Service, Audit Service, Diagnostics
- Added Timeline Generator and Correlation Explorer
- Added replay fixtures and developer documentation under `docs/connect/`

## Sprint 3B-2 — Universal Models & Event Pipeline

- Added universal ATS models (`AtsCandidate`, `AtsJob`, etc.)
- Added standard ATS event types and validation
- Added Greenhouse mappers and translation pipeline
- Added webhook JSON fixtures and pipeline contract tests

## Sprint 3B-1 — Greenhouse Provider Foundation

- Added Greenhouse provider with OAuth (PKCE), Harvest client, and health checks
- Added provider configuration, manifest, and registration
- Added Greenhouse provider tests and documentation

## Sprint 3A — Connect Platform Foundation

- Added Provider Registry and Provider Loader
- Added MockATS provider
- Added Event Bus, Dead Letter Queue, Retry Service
- Added Configuration, Logging, and Health services
