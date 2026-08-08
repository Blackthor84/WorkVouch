# WorkVouch Connect — Diagnostics

## Service

`ConnectDiagnosticsService` — `lib/integrations/connect/diagnostics/`

## Checks

| Check | Description |
|-------|-------------|
| Configuration validation | Platform config + warnings |
| Feature flags | All provider flags |
| Provider registration | Registered + enabled state |
| Capability inspection | Per-provider capabilities |
| Environment validation | Required env vars |
| OAuth health | OAuth-enabled provider count |
| Token status | Storage mode (in-memory until 3B-4+) |

## Usage

```typescript
const report = connect.runDiagnostics();

console.log(report.platform);       // "WorkVouch Connect"
console.log(report.providers);
console.log(report.featureFlags);
console.log(report.configuration);
console.log(report.environment);
```

## Provider Health

```typescript
const provider = manager.getProvider("greenhouse");
const health = await connect.diagnostics.inspectProviderHealth(provider, {
  connectionId: "conn-1",
  accessToken: "token",
  employerAccountId: "employer-1",
});
```
