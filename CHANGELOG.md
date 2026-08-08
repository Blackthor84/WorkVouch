# Changelog

All notable changes to the WorkVouch Connect integration platform are documented here.

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
