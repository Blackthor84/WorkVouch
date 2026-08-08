# Import Pipeline

Harvest import pipeline for Sprint 5 — inbound only, no UI, no verification.

## Flow

```
ConnectionManager.getTokens()
        ↓
HarvestClient.listJobs / listCandidates / listApplications
        ↓
Greenhouse mappers → universal models
        ↓
connect_job_map / connect_candidate_map
        ↓
ConnectEventStore.appendEvent()
        ↓
ProjectionEngine.projectState()
        ↓
connect_sync_log
```

## HarvestImportService

```typescript
import { HarvestImportService } from "@/lib/integrations/providers/greenhouse/sync/harvest-import-service";

const result = await harvestImport.importAll({
  connectionId: "uuid",
  employerAccountId: "employer-1",
  maxPages: 5,
});

console.log(result.jobsImported, result.candidatesImported, result.eventsStored);
```

## API Trigger

```
POST /api/integrations/v1/import
{
  "connectionId": "...",
  "employerAccountId": "...",
  "maxPages": 5
}
```

## Idempotency

Import events use idempotency keys: `greenhouse:import:{type}:{externalId}:{connectionId}`

Re-running import does not duplicate events.

## Single-Entity Sync

`GreenhouseProvider.syncCandidate/syncJob/syncApplication` fetch individual entities via Harvest for targeted updates.

## Future Providers

Import pipeline pattern is reusable — each provider implements its own import service that writes to the same Connect persistence layer.
