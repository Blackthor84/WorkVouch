# WorkVouch Connect — Diagnostic Bundles

Portable support bundles package everything a support engineer needs to diagnose integration issues without requesting screenshots or customer logs.

## Overview

Every provider connection exposes one action: **Download Diagnostic Bundle**.

The bundle is:

- **Self-contained** — connection metadata, health, sync, events, audit, replay refs
- **Secure** — secrets automatically redacted with audit trail of redactions
- **Portable** — ZIP, JSON, or Markdown export with checksums
- **Provider-agnostic** — same format for Greenhouse and future ATS providers

## Architecture

```
Employer UI / API
       ↓
DiagnosticBundleService
       ↓
BundleBuilder → BundleRedactor → BundleValidator → BundleExporter
       ↓
Connect Runtime (health, connections, events, metrics)
```

### Modules

| Module | Path | Role |
|--------|------|------|
| `DiagnosticBundleService` | `diagnostics/diagnostic-bundle-service.ts` | Developer API |
| `BundleBuilder` | `diagnostics/bundle-builder.ts` | Assembles bundle sections |
| `BundleRedactor` | `diagnostics/bundle-redactor.ts` | Secret and PII masking |
| `BundleValidator` | `diagnostics/bundle-validator.ts` | Structure + leak scan |
| `BundleExporter` | `diagnostics/bundle-exporter.ts` | JSON, ZIP, Markdown export |

## Developer API

```typescript
const runtime = getConnectApiRuntime();

// Full bundle object (validated)
const bundle = await runtime.diagnosticBundles.generateDiagnosticBundle({
  connectionId: "conn-1",
  employerAccountId: "employer-1",
  maxEvents: 100,
  maxLogs: 200,
});

// Download export
const zip = await runtime.diagnosticBundles.downloadDiagnosticBundle({
  connectionId: "conn-1",
  employerAccountId: "employer-1",
  format: "zip", // json | markdown
});

// Preview without validation throw
const preview = await runtime.diagnosticBundles.previewDiagnosticBundle({
  connectionId: "conn-1",
  employerAccountId: "employer-1",
});

// Validate existing bundle
const result = runtime.diagnosticBundles.validateDiagnosticBundle(bundle);
```

## Employer API

```
GET /api/employer/integrations/connections/[connectionId]/diagnostic-bundle
```

Query parameters:

| Param | Default | Description |
|-------|---------|-------------|
| `format` | `zip` | `zip`, `json`, or `markdown` |
| `preview` | — | `1` returns JSON preview (no download) |
| `maxEvents` | `100` | Recent event cap |
| `maxLogs` | `200` | Structured log cap |

Requires employer session and connection ownership.

## Employer UI

**Provider details** (`/employer/integrations/greenhouse`) includes **Download Diagnostic Bundle**:

- Generation progress indicator
- Bundle size and timestamp on success
- Error message on failure

## Bundle Contents

See [bundle-format.md](./bundle-format.md).

## Redaction

See [redaction-policy.md](./redaction-policy.md).

## Support Workflow

See [support-workflow.md](./support-workflow.md).

## Related

- [Health](./health.md)
- [Replay](./replay.md)
- [Event Store](./event-store.md)
- [Troubleshooting](./troubleshooting.md)
