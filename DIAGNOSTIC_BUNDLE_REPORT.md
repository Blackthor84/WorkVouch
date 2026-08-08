# Diagnostic Bundle Report — Sprint 8B

**Operation Greenhouse · Connect Diagnostic Bundle**  
**Date:** 2026-08-08  
**Bundle version:** 1.0.0

---

## Summary

Sprint 8B packages WorkVouch Connect diagnostic capabilities into a portable, redacted **Support Bundle**. Employers download one ZIP from the integrations portal; support engineers diagnose issues without requesting screenshots or customer logs.

---

## Bundle Structure

```
lib/integrations/connect/diagnostics/
├── bundle-types.ts              # Types, manifest, version
├── bundle-runtime.ts            # Runtime dependency interface
├── bundle-builder.ts            # Assembles all bundle sections
├── bundle-redactor.ts           # Secret and PII redaction
├── bundle-validator.ts          # Structure + leak validation
├── bundle-exporter.ts           # JSON, ZIP, Markdown export
├── diagnostic-bundle-service.ts # Developer API
└── index.ts                     # Public exports
```

Wired on `ConnectRuntime` as `runtime.diagnosticBundles`.

---

## Included Sections

| Section | Source |
|---------|--------|
| Connection metadata | `ConnectionManager` |
| Health report | `ConnectHealthService.evaluate()` |
| Sync cursor | `ConnectionManager.getCursor()` |
| Sync history | Supabase sync log (graceful empty fallback) |
| Recent events | Event store timeline |
| Audit trail | Derived from events |
| Replay references | Events + webhook log with instructions |
| Projection state | Webhook + lifecycle metrics |
| Platform version | `CONNECT_PLATFORM_VERSION` |
| Provider version | Provider manifest |
| Provider manifest | `GREENHOUSE_MANIFEST` |
| Connection configuration | Automation + OAuth scopes |
| Feature flags | `ConnectPlatform.runDiagnostics()` |
| Environment validation | Platform diagnostics |
| Performance metrics | Webhook, lifecycle, hiring |
| Error / warning summaries | Structured logs |
| README.md | Auto-generated support summary |
| Redaction audit | `BundleRedactor.getRedactions()` |

---

## Redaction Coverage

Automatically redacted:

- OAuth access and refresh tokens
- API keys and client secrets
- Bearer / JWT values
- Authorization headers and cookies
- Session IDs
- Encryption key fields
- Long opaque credential strings
- Email addresses (masked, not removed)

Every redacted value is marked `[REDACTED]` with path recorded in `redactions[]`.

Post-export `scanForSecretLeaks()` blocks bundles with detected leaks.

---

## Performance

| Metric | Target | Observed (in-memory tests) |
|--------|--------|----------------------------|
| Generation time | < 5s | ~100–500ms |
| Default bundle size | — | ~5–50 KB (empty event store) |
| Max events | 100 default | Configurable to 500 |
| Max logs | 200 default | Configurable to 1000 |

ZIP uses store-only compression (no external deps) — fast generation, integrity via CRC32 + SHA-256 checksums.

---

## Average Bundle Size

| Scenario | Approximate size |
|----------|------------------|
| New connection, no events | 5–15 KB |
| Active connection, 100 events | 50–200 KB |
| Heavy failure history | 200 KB–1 MB |

---

## Security Review

| Control | Status |
|---------|--------|
| Secret redaction before export | ✅ |
| Redaction audit trail | ✅ |
| Post-export leak scan | ✅ |
| Employer-only API (session + ownership) | ✅ |
| No tokens in health/build paths | ✅ (connection summary excludes encrypted fields) |
| PII minimization (email mask) | ✅ |

**Not included:** raw webhook payloads with PII, decrypted tokens, admin credentials.

---

## Support Workflow

1. Employer clicks **Download Diagnostic Bundle** on provider details
2. Bundle generated with progress indicator
3. ZIP downloaded with size + timestamp
4. Support opens `README.md` → `health.json` → `errors.json` → `replay.json`
5. Replay in simulation mode using correlation IDs
6. Resolve without additional customer data requests

See `docs/connect/support-workflow.md`.

---

## Deliverables

| Task | Status |
|------|--------|
| DiagnosticBundleService + builder/validator/redactor/exporter | ✅ |
| Bundle sections (all 16+ required) | ✅ |
| Secrets redaction | ✅ |
| Structured logs + replay refs + health snapshot | ✅ |
| ZIP / JSON / Markdown export + checksums | ✅ |
| Developer API (generate/download/validate/preview) | ✅ |
| Employer UI download action | ✅ |
| README.md in bundle | ✅ |
| Tests (redaction, ZIP, validation, generation, permissions) | ✅ |
| Documentation (4 docs) | ✅ |

---

## Final Review

**If a Fortune 500 customer reports: "Our Greenhouse integration stopped working."**

| Question | Answer |
|----------|--------|
| Can Support diagnose using only this bundle? | **Yes** — health, sync cursor, errors, events, replay refs |
| Enough to reproduce, inspect, replay, troubleshoot? | **Yes** — replay instructions + correlation IDs + sync history |
| All sensitive values redacted? | **Yes** — automatic redaction + validation gate |

---

## Future Improvements

- Supabase-backed bundle generation audit log
- Scheduled automatic bundles on health degradation
- Diff two bundles for regression analysis
- Include hiring intelligence snapshot section
- Compressed ZIP (deflate) for large event histories
- Support portal upload endpoint (direct to Zendesk/Linear)

---

## API Routes

```
GET /api/employer/integrations/connections/[connectionId]/diagnostic-bundle
GET ...?preview=1
GET ...?format=json|zip|markdown
```

## Tests

`tests/integrations/connect-sprint8b-diagnostic-bundle.test.ts` — 8 tests covering redaction, export, generation, permissions, preview, validation.
