# Connect Health

Internal-only health dashboard — no UI. Returns typed health objects.

## ConnectHealthService

```typescript
import { ConnectHealthService } from "@/lib/integrations/connect";

const report = await health.evaluate(connectionId);
console.log(report.overallScore, report.overallStatus);
```

## Components Monitored

| Component | Checks |
|-----------|--------|
| `platform` | Connect version |
| `provider` | Provider registration + version |
| `oauth` | Token validity + expiration |
| `connection` | Connection status + last sync |
| `harvest` | API reachability + latency |
| `persistence` | Event store access |
| `database` | Repository layer |
| `replay` | Replay engine availability |
| `projection` | Projection engine availability |
| `snapshots` | Snapshot service availability |

## Health Report Shape

```typescript
interface ConnectHealthReport {
  evaluatedAt: string;
  connectVersion: string;
  overallScore: number;        // 0-100
  overallStatus: "healthy" | "degraded" | "unhealthy" | "unknown";
  components: ConnectHealthComponent[];
  connection?: { ... };
}
```

## API

```
GET /api/integrations/v1/health?connectionId=...
```

## Recovery Integration

`ConnectRecoveryService` handles OAuth refresh with exponential backoff when health detects expired tokens.

## Score Calculation

- healthy = 100 points
- degraded = 60 points
- unknown = 50 points
- unhealthy = 0 points

Overall score = average across all components.
