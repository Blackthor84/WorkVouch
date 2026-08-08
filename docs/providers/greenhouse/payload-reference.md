# Greenhouse Payload Reference

> **Note:** All JSON files under `fixtures/greenhouse/` are marked with `"_fixture": true` and are not production data.

## Webhook Envelope

All Greenhouse webhooks follow this structure:

```json
{
  "action": "candidate_created",
  "payload": { }
}
```

## Candidate Payload

```json
{
  "id": 12345,
  "first_name": "Jane",
  "last_name": "Chen",
  "email_addresses": [{ "value": "jane@email.com", "type": "personal" }],
  "phone_numbers": [{ "value": "+14155550123", "type": "mobile" }],
  "applications": [],
  "created_at": "2026-08-07T20:00:00Z",
  "updated_at": "2026-08-07T20:00:00Z"
}
```

## Application Payload

```json
{
  "id": 67890,
  "candidate_id": 12345,
  "jobs": [{ "id": 111, "name": "Senior Software Engineer" }],
  "status": "active",
  "current_stage": { "id": 222, "name": "Application Review" },
  "applied_at": "2026-08-07T20:00:00Z",
  "updated_at": "2026-08-07T20:00:00Z"
}
```

## Job Payload

```json
{
  "id": 111,
  "name": "Senior Software Engineer",
  "status": "open",
  "departments": [{ "id": 10, "name": "Engineering" }],
  "opened_at": "2026-08-01T09:00:00Z"
}
```

## Offer Payload

```json
{
  "id": 999,
  "application_id": 67890,
  "candidate_id": 12345,
  "status": "pending",
  "created_at": "2026-08-07T22:00:00Z"
}
```

## Fixture Files

| File | Action |
|------|--------|
| `candidate-created.json` | `candidate_created` |
| `candidate-updated.json` | `candidate_updated` |
| `application-created.json` | `application_created` |
| `job-created.json` | `job_created` |
| `offer-created.json` | `offer_created` |
| `offer-accepted.json` | `offer_accepted` |
| `candidate-hired.json` | `hire_candidate` |
| `candidate-rejected.json` | `reject_candidate` |
| `webhook-example.json` | `application_updated` |

Based on Greenhouse webhook documentation and `docs/integration-contract/04-webhook-contract.md`.
