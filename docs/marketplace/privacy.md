# Privacy

## Data Collected

| Data | Purpose | Retention |
|------|---------|-----------|
| Candidate email | Profile linking | Connection lifetime |
| Greenhouse candidate ID | Panel + sync mapping | Connection lifetime |
| Webhook payloads | Event store, replay | Per retention policy |
| OAuth tokens | API access | Until disconnect |
| Hiring metrics | Intelligence dashboard | Aggregated snapshots |

## Data Not Collected

- Precise location (city, ZIP, coordinates)
- IP addresses in Connect event store
- Greenhouse passwords or admin credentials

## Candidate Visibility

- WorkVouch profile data shown only when candidate is linked by email
- Trust scores and verification status from WorkVouch platform (not Greenhouse)

## Employer Controls

- Disconnect removes OAuth tokens
- Automation rules configurable per connection
- Diagnostic bundle download is employer-initiated

## Third Parties

- **Greenhouse** — ATS data via OAuth and webhooks
- **Supabase** — database hosting (encrypted at rest)

## GDPR / Privacy Requests

Handled via WorkVouch platform privacy workflow — Connect data included in employer/candidate export and deletion requests.

## Disclaimer

Locations shown in WorkVouch are approximate and aggregated to protect user privacy.

See also WorkVouch Privacy Policy (production site).
