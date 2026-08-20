# Greenhouse Custom Fields (V3)

## Approved scopes

- `harvest:custom_fields:list` — read field definitions
- `harvest:candidates:update` — update candidate field values (future write path)

Sprint 12 **does not** auto-create or delete Greenhouse custom fields.

## V3 data shape

Candidate custom fields arrive as an **object map**:

```json
{
  "custom_fields": {
    "select_custom_field": {
      "name": "Select custom field",
      "type": "single_select",
      "value": "first"
    }
  }
}
```

WorkVouch normalizes V1 arrays and V3 maps in `customFieldMapper.ts`.

## Import behavior

During Harvest import, WorkVouch catalogs custom field definitions via `GET /v3/custom_fields` and stores counts in sync metadata (`customFieldsCataloged`).

## Mapping strategy

1. List definitions from Greenhouse (read-only).
2. Identify WorkVouch-owned fields by name convention (configure per employer during sandbox validation).
3. Write candidate updates only through explicit sync operations using `harvest:candidates:update` — not enabled by default in Sprint 12 import.

## Sandbox dependency

Field names and types must be validated against the real Greenhouse testing account before enabling write-back.
