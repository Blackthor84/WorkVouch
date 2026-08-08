# 13 — Provider Capability Manifest

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Purpose

The provider capability manifest declares what each ATS provider supports. The integration platform reads this manifest to determine available features, route operations, and display provider status in the UI.

Adding a new provider = implement `AtsProvider` + create manifest entry + register in `ProviderRegistry`.

---

## Manifest Schema

```typescript
// Design specification only
interface ProviderManifest {
  provider: AtsProviderId
  displayName: string
  apiVersion: string
  logoUrl: string
  docsUrl: string
  status: 'available' | 'beta' | 'coming_soon'

  // Capability flags
  supportsOAuth: boolean
  supportsWebhooks: boolean
  supportsCandidates: boolean
  supportsJobs: boolean
  supportsApplications: boolean
  supportsCustomFields: boolean
  supportsStatusSync: boolean
  supportsNotes: boolean
  supportsAttachments: boolean
  supportsReferenceRequests: boolean
  supportsAI: boolean
  supportsBatchSync: boolean

  // Authentication
  authenticationType: 'oauth2' | 'api_key' | 'oauth2_pkce'
  oauthConfig?: {
    authorizationUrl: string
    tokenUrl: string
    scopes: string[]
    pkceRequired: boolean
  }

  // Rate limits
  rateLimits: {
    requestsPerWindow: number
    windowSeconds: number
    retryAfterHeader: boolean
  }

  // Retry policy
  retryPolicy: {
    maxAttempts: number
    backoffMs: number[]
    retryOnStatus: number[]
  }

  // Webhook config
  webhookConfig?: {
    signatureHeader: string
    signatureAlgorithm: 'hmac-sha256' | 'hmac-sha1'
    signaturePrefix: string
    registrationMethod: 'api' | 'manual'
    supportedEvents: string[]
  }

  // Custom field config
  customFieldConfig?: {
    candidateFieldType: string
    maxFields: number
    fieldCreationMethod: 'api' | 'manual'
    supportedTypes: ('number' | 'text' | 'long_text' | 'url' | 'date' | 'single_select')[]
  }

  // Export fields this provider supports
  exportFields: string[]

  // Sprint availability
  availableFromSprint: number
}
```

---

## Greenhouse Manifest

```json
{
  "provider": "greenhouse",
  "displayName": "Greenhouse",
  "apiVersion": "1.0",
  "logoUrl": "https://workvouch.com/integrations/greenhouse-logo.svg",
  "docsUrl": "https://docs.workvouch.com/integrations/greenhouse",
  "status": "available",

  "supportsOAuth": true,
  "supportsWebhooks": true,
  "supportsCandidates": true,
  "supportsJobs": true,
  "supportsApplications": true,
  "supportsCustomFields": true,
  "supportsStatusSync": true,
  "supportsNotes": true,
  "supportsAttachments": false,
  "supportsReferenceRequests": false,
  "supportsAI": true,
  "supportsBatchSync": true,

  "authenticationType": "oauth2_pkce",
  "oauthConfig": {
    "authorizationUrl": "https://auth.greenhouse.io/authorize",
    "tokenUrl": "https://auth.greenhouse.io/token",
    "scopes": ["harvest:read", "harvest:write"],
    "pkceRequired": true
  },

  "rateLimits": {
    "requestsPerWindow": 50,
    "windowSeconds": 10,
    "retryAfterHeader": true
  },

  "retryPolicy": {
    "maxAttempts": 5,
    "backoffMs": [1000, 2000, 4000, 8000, 16000],
    "retryOnStatus": [429, 500, 502, 503, 504]
  },

  "webhookConfig": {
    "signatureHeader": "Signature",
    "signatureAlgorithm": "hmac-sha256",
    "signaturePrefix": "sha256=",
    "registrationMethod": "api",
    "supportedEvents": [
      "candidate_created",
      "candidate_updated",
      "application_created",
      "application_updated",
      "hire_candidate",
      "reject_candidate",
      "offer_created",
      "job_created",
      "job_updated"
    ]
  },

  "customFieldConfig": {
    "candidateFieldType": "candidate",
    "maxFields": 20,
    "fieldCreationMethod": "api",
    "supportedTypes": ["number", "text", "long_text", "url", "date", "single_select"]
  },

  "exportFields": [
    "workvouch_trust_score",
    "workvouch_trust_band",
    "workvouch_verification_status",
    "workvouch_verification_count",
    "workvouch_vouch_count",
    "workvouch_manager_vouch_count",
    "workvouch_coworker_vouch_count",
    "workvouch_ai_summary",
    "workvouch_reference_completion_pct",
    "workvouch_would_rehire_pct",
    "workvouch_profile_url",
    "workvouch_last_synced_at"
  ],

  "availableFromSprint": 3
}
```

---

## Mock Provider Manifest (Testing)

```json
{
  "provider": "mock",
  "displayName": "Mock ATS (Test)",
  "apiVersion": "1.0",
  "status": "available",
  "supportsOAuth": true,
  "supportsWebhooks": true,
  "supportsCandidates": true,
  "supportsJobs": true,
  "supportsApplications": true,
  "supportsCustomFields": true,
  "supportsStatusSync": true,
  "supportsNotes": true,
  "supportsAttachments": false,
  "supportsReferenceRequests": false,
  "supportsAI": false,
  "supportsBatchSync": true,
  "authenticationType": "api_key",
  "rateLimits": { "requestsPerWindow": 1000, "windowSeconds": 10, "retryAfterHeader": false },
  "retryPolicy": { "maxAttempts": 3, "backoffMs": [100, 200, 400], "retryOnStatus": [500] },
  "exportFields": ["workvouch_trust_score", "workvouch_trust_band"],
  "availableFromSprint": 3
}
```

---

## Future Provider Stubs

| Provider | Sprint | OAuth | Webhooks | Custom Fields | Notes |
|----------|--------|-------|----------|---------------|-------|
| Lever | 7 | ✅ | ✅ | ✅ | Similar to GH |
| Ashby | 8 | ✅ | ✅ | ✅ | Modern API |
| Workday | 10 | ✅ | ❌ | ✅ | Enterprise; polling only |
| iCIMS | 10 | ✅ | ✅ | ✅ | Enterprise |
| SmartRecruiters | 9 | ✅ | ✅ | ✅ | Marketplace partner |
| BambooHR | 9 | API key | ❌ | Limited | HR-focused |
| Rippling | 10 | ✅ | ❌ | Limited | HR-focused |
| HiBob | 10 | ✅ | ❌ | Limited | HR-focused |

---

## How Future Providers Use the Manifest

### Step 1: Create Manifest

```typescript
// lib/integrations/providers/lever/manifest.ts
export const leverManifest: ProviderManifest = {
  provider: 'lever',
  displayName: 'Lever',
  // ... fill all required fields
}
```

### Step 2: Implement AtsProvider

```typescript
// lib/integrations/providers/lever/LeverAdapter.ts
export class LeverAdapter implements AtsProvider {
  readonly providerId = 'lever'
  readonly displayName = 'Lever'
  readonly supportedFeatures = deriveFeatures(leverManifest)
  // ... implement all interface methods
}
```

### Step 3: Register

```typescript
// lib/integrations/providers/registry.ts
ProviderRegistry.register('greenhouse', GreenhouseAdapter, greenhouseManifest)
ProviderRegistry.register('lever', LeverAdapter, leverManifest)
ProviderRegistry.register('mock', MockAtsAdapter, mockManifest)
```

### Step 4: Feature Gating

```typescript
// Platform reads manifest to gate features
function canExportField(provider: AtsProviderId, field: string): boolean {
  const manifest = ProviderRegistry.getManifest(provider)
  return manifest.exportFields.includes(field)
}

function canUseWebhooks(provider: AtsProviderId): boolean {
  return ProviderRegistry.getManifest(provider).supportsWebhooks
}
```

### Step 5: UI Adaptation

```typescript
// Settings UI shows only supported features
function getAvailableSettings(provider: AtsProviderId): SettingSection[] {
  const m = ProviderRegistry.getManifest(provider)
  return [
    m.supportsOAuth && 'connection',
    m.supportsCustomFields && 'custom_fields',
    m.supportsBatchSync && 'sync',
    m.supportsAI && 'ai',
  ].filter(Boolean)
}
```

---

## Manifest Validation

Every manifest must pass validation on registration:

```
✓ provider is unique
✓ apiVersion is semver
✓ If supportsOAuth → oauthConfig present
✓ If supportsWebhooks → webhookConfig present
✓ If supportsCustomFields → customFieldConfig present
✓ exportFields is non-empty if supportsCustomFields
✓ rateLimits.requestsPerWindow > 0
✓ retryPolicy.maxAttempts >= 1
✓ All exportFields match 07-custom-fields.md name_keys
```

---

## Related Documents

- [docs/integrations/03-provider-interface.md](../integrations/03-provider-interface.md)
- [docs/integrations/13-provider-roadmap.md](../integrations/13-provider-roadmap.md)
- [07-custom-fields.md](./07-custom-fields.md)
