# Connect Versioning

WorkVouch Connect uses **semver** for platform and provider compatibility.

## Platform Version

```typescript
import { CONNECT_PLATFORM_VERSION } from "@/lib/integrations/connect";
// "1.0.0"
```

Defined in `lib/integrations/connect/version.ts`.

## Provider Manifest Requirements

Every provider manifest must declare:

| Field | Description |
|-------|-------------|
| `provider` | Provider ID |
| `version` | Provider package version |
| `apiVersion` | External API version |
| `compatibleConnectVersion` | Target Connect version |
| `minimumConnectVersion` | Minimum supported Connect version |
| `maximumTestedConnectVersion` | Highest Connect version tested against |

Additional capability flags: `supportsOAuth`, `supportsWebhooks`, `supportsCandidates`, `supportsJobs`, etc.

## Validation

Compatibility is validated during provider registration:

```typescript
import { validateProviderManifestVersion, isConnectVersionCompatible } from "@/lib/integrations/connect";

const result = validateProviderManifestVersion(GREENHOUSE_MANIFEST);
if (!result.valid) {
  console.error(result.errors);
}

const compat = isConnectVersionCompatible(CONNECT_PLATFORM_VERSION, manifest);
```

`ProviderRegistry.registerProvider()` rejects incompatible manifests with `PROVIDER_VERSION_INCOMPATIBLE`.

## Semver Comparison

```typescript
import { compareSemver, parseSemver } from "@/lib/integrations/connect";

compareSemver("1.0.0", "1.0.0"); // 0 (equal)
compareSemver("1.1.0", "1.0.0"); // 1 (greater)
compareSemver("0.9.0", "1.0.0"); // -1 (less)
```

## Upgrade Path

When Connect releases a new major version:

1. Update `CONNECT_PLATFORM_VERSION`
2. Update provider manifests with new `compatibleConnectVersion`
3. Run integration tests to verify compatibility
4. Document breaking changes in `CHANGELOG.md`

## Greenhouse Example

```typescript
export const GREENHOUSE_MANIFEST = {
  provider: "greenhouse",
  version: "1.0.0",
  apiVersion: "1.0",
  compatibleConnectVersion: "1.0.0",
  minimumConnectVersion: "1.0.0",
  maximumTestedConnectVersion: "1.0.0",
  supportsOAuth: true,
  supportsWebhooks: true,
  // ...
};
```
