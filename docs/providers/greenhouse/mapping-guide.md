# Greenhouse Mapping Guide

## Principle

Greenhouse payloads are converted to universal ATS models before entering the platform. Mappers live exclusively in `providers/greenhouse/mappers/`.

## Mapper Reference

| Mapper | Input | Output |
|--------|-------|--------|
| `candidateMapper` | `GreenhouseCandidate` | `AtsCandidate` |
| `jobMapper` | `GreenhouseJob` | `AtsJob` |
| `applicationMapper` | `GreenhouseApplication` / `GreenhouseOffer` | `AtsApplication` |
| `companyMapper` | `GreenhouseCompany` | `AtsCompany` |
| `userMapper` | `GreenhouseUser` | `AtsEmployer` |
| `statusMapper` | GH stage/status strings | `ApplicationStatus` |
| `customFieldMapper` | GH custom fields | `Record<string, unknown>` |
| `webhookMapper` | Raw webhook JSON | Route + `AtsWebhookEvent` |
| `sharedMapper` | — | ID/email/name utilities |

## Webhook Action Routing

| Greenhouse Action | Universal Event | Mapper |
|-------------------|-----------------|--------|
| `candidate_created` | `ats.candidate.created` | candidateMapper |
| `candidate_updated` | `ats.candidate.updated` | candidateMapper |
| `application_created` | `ats.application.created` | applicationMapper |
| `application_updated` | `ats.candidate.moved` | applicationMapper |
| `job_created` | `ats.job.created` | jobMapper |
| `job_updated` | `ats.job.updated` | jobMapper |
| `offer_created` | `ats.offer.created` | applicationMapper |
| `offer_accepted` | `ats.offer.accepted` | applicationMapper |
| `offer_rejected` | `ats.offer.rejected` | applicationMapper |
| `hire_candidate` | `ats.candidate.hired` | applicationMapper |
| `reject_candidate` | `ats.candidate.rejected` | applicationMapper |
| `candidate_withdrawn` | `ats.candidate.withdrawn` | applicationMapper |

## Status Mapping

Greenhouse pipeline stages map to canonical application status:

| Greenhouse Stage | Universal Status |
|------------------|------------------|
| Application Review | `applied` |
| Phone Screen | `screening` |
| On-site / Final Interview | `interview` |
| Offer | `offer` |
| Hired | `hired` |
| Rejected | `rejected` |
| Withdrawn | `withdrawn` |
| Unknown | `unknown` |

## Trust & Verification Defaults

Inbound candidate events default to:

- `trustStatus: "not_linked"`
- `verificationStatus: "not_invited"`

WorkVouch services update these in later sprints.

## Adding Lever

Copy the mapper folder pattern:

1. Create `providers/lever/models/`
2. Create `providers/lever/mappers/`
3. Create `providers/lever/services/event-translator.ts`
4. Route to the same universal models and event types

No platform changes required.
