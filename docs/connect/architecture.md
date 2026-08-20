# WorkVouch Connect — Architecture

## Overview

**WorkVouch Connect** is the internal developer platform for ATS integrations. It provides inspection, replay, diagnostics, audit trails, and correlation exploration across all providers (Greenhouse, Lever, Ashby, Workday, and future adapters).

Runtime code lives under `lib/integrations/`. API namespaces (`ATS_ENABLED`, `AtsProvider`, etc.) are unchanged for backward compatibility.

## Module Structure

```
lib/integrations/connect/
├── connect-platform.ts      # Facade — developer API
├── types.ts                 # Connect-specific types
├── history/                 # In-memory event history
├── audit/                   # Audit trail service
├── inspector/               # Event inspection
├── replay/                  # Safe replay engine
├── diagnostics/             # Platform diagnostics
├── timeline/                # Timeline generator
├── correlation/             # Correlation explorer
└── fixtures/replay/         # Replay scenario fixtures
```

## Design Principles

1. **Provider agnostic** — no provider-specific logic in connect/
2. **Simulation first** — replay defaults to dry-run mode
3. **No duplicate persistence** — in-memory only
4. **Complete audit trail** — every lifecycle stage recorded
5. **Enterprise observability** — structured logs + timelines

## Integration Points

| Existing Component | Connect Usage |
|--------------------|---------------|
| `EventDispatcher` | Bus event inspection + live replay from DLQ |
| `StructuredLoggingService` | Log correlation and exploration |
| `AtsEventPipeline` | Translation capture |
| `EventValidator` | Validation replay |
| `MockEventConsumer` | Consumer replay simulation |
| `ProviderRegistry` | Diagnostics |

## Provider Boundaries

Greenhouse translation remains in `providers/greenhouse/`. Connect records and inspects the output — it never imports Greenhouse-specific code.

## Developer API

```typescript
import { createConnectPlatform } from "@/lib/integrations";

const connect = createConnectPlatform(deps);

connect.inspectEvent(eventId);
connect.simulateReplay(eventId);
connect.exploreCorrelation(correlationId);
connect.runDiagnostics();
```

No public HTTP routes in Sprint 3B-3.
