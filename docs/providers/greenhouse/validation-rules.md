# Greenhouse Validation Rules

## Validation Layers

1. **Payload parsing** — malformed JSON/objects throw `MALFORMED_PAYLOAD`
2. **Entity validation** — required fields on universal models
3. **Event type validation** — must be a known `AtsEventType`
4. **Context validation** — duplicate and out-of-order detection

## Required Fields

### AtsCandidate

| Field | Required | Notes |
|-------|----------|-------|
| `externalId` | Yes | Greenhouse candidate ID |
| `email` | Recommended | Warning if missing |
| `fullName` | Implicit | Built from first + last name |

### AtsJob

| Field | Required | Notes |
|-------|----------|-------|
| `externalId` | Yes | |
| `title` | Yes | |
| `status` | Yes | Must be open/closed/draft/archived |
| `location.state` | US only | Required when country is US |

### AtsApplication

| Field | Required | Notes |
|-------|----------|-------|
| `externalId` | Yes | |
| `candidateExternalId` | Yes | |
| `jobExternalId` | Yes | Warning only for offer events |
| `status` | Yes | Must be valid `ApplicationStatus` |

## Error Codes

| Code | Meaning |
|------|---------|
| `REQUIRED_FIELD_MISSING` | Required field absent |
| `UNKNOWN_ENUM` | Unrecognized enum value |
| `INVALID_STATUS` | Invalid application status |
| `MISSING_ID` | External ID missing |
| `MALFORMED_PAYLOAD` | Unparseable webhook payload |
| `DUPLICATE_EVENT` | Event ID already processed |
| `OUT_OF_ORDER_EVENT` | Sequence number regression |

## Duplicate Detection

- Tracked in-memory by event ID
- Dispatcher also deduplicates via `idempotencyKey` (`action:entityId:updatedAt`)

## Out-of-Order Detection

- Sequence numbers tracked per `eventType:entityPrefix`
- Lower sequence after higher sequence → `OUT_OF_ORDER_EVENT`

## Location Safety

Job location mapping follows WorkVouch location rules:

- Only `country` (ISO-2) and `state` (US only) allowed
- No city, zip, or coordinates stored
