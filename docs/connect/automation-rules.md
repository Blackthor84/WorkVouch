# Automation Rules

Employers configure automation once on the Greenhouse connection. Every future candidate event is evaluated against these rules automatically.

## Rule Pipeline

```
Universal Event + Candidate/Application Context
  → Manual Only check
  → Job Filter
  → Department Filter
  → Location Filter
  → Employment Type Filter
  → Invite Trigger
  → eligible: true/false
```

## Invite Triggers

| Trigger | Config Value | Fires When |
|---------|--------------|------------|
| Invite after Application | `application` | `ApplicationCreated` |
| Invite after Phone Screen | `phone_screen` | `CandidateMoved` + stage matches `/phone\s*screen\|screening/i` |
| Invite after Final Interview | `final_interview` | `CandidateMoved` + stage matches `/final\s*interview\|onsite\|on-site/i` |
| Invite after Offer | `offer` | `OfferCreated` or stage matches `/offer/i` |
| Invite after Hire | `hire` | `CandidateHired` |
| Manual Only | `manual` | Never auto-invites |

Default trigger: `final_interview`.

## Filters

Each filter supports three modes:

| Mode | Behavior |
|------|----------|
| `all` | No filtering — all pass |
| `selected` | Only IDs in the list pass |
| `excluded` | IDs in the list are blocked |

### Job Filter

```json
{
  "job_filter_mode": "selected",
  "job_filter_ids": ["job-123", "job-456"]
}
```

Uses `application.jobExternalId` or `candidate.jobExternalId`.

### Department Filter

```json
{
  "department_filter_mode": "selected",
  "department_filter_ids": ["engineering", "sales"]
}
```

Uses `application.metadata.department` or `candidate.metadata.department`.

### Location Filter

```json
{
  "location_filter_mode": "selected",
  "location_filter": ["US", "CA"]
}
```

Uses ISO-2 country from `metadata.country`. Aligns with WorkVouch location safety (country/state only).

### Employment Type Filter

```json
{
  "employment_type_filter_mode": "excluded",
  "employment_type_filter": ["contractor", "intern"]
}
```

Uses `application.metadata.employmentType`.

## Manual Only Mode

Set either:

```json
{ "auto_invite_enabled": false }
```

or:

```json
{ "auto_invite_trigger": "manual" }
```

Decision: `wait` — candidate stays in lifecycle until a recruiter acts manually (future UI).

## Delay

```json
{ "auto_invite_delay_hours": 24 }
```

Eligible invitations are scheduled 24 hours after the trigger fires. State becomes `eligible` until the scheduled time, then `invited`.

## Eligibility Requirements

All must be true for auto-invite:

1. `auto_invite_enabled !== false`
2. Trigger rule matched
3. All filters passed
4. Candidate not already invited (`candidateMap.metadata.invited_at` absent)

## Example Configurations

**Engineering roles only, invite at final interview:**

```json
{
  "automation": {
    "auto_invite_enabled": true,
    "auto_invite_trigger": "final_interview",
    "department_filter_mode": "selected",
    "department_filter_ids": ["engineering"]
  }
}
```

**Immediate invite on application, US only:**

```json
{
  "automation": {
    "auto_invite_trigger": "application",
    "location_filter_mode": "selected",
    "location_filter": ["US"]
  }
}
```

**Fully manual:**

```json
{
  "automation": {
    "auto_invite_enabled": false,
    "auto_invite_trigger": "manual"
  }
}
```

## Rule IDs (Observability)

| Rule ID | Type |
|---------|------|
| `manual_only` | Block |
| `filter_job` | Filter |
| `filter_department` | Filter |
| `filter_location` | Filter |
| `filter_employment_type` | Filter |
| `trigger_application` | Trigger |
| `trigger_phone_screen` | Trigger |
| `trigger_final_interview` | Trigger |
| `trigger_offer` | Trigger |
| `trigger_hire` | Trigger |

Recorded in `LifecycleObservability` as `ruleMatched`.
