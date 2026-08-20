# Employment Normalization

## Target model

`employment_records` — the single WorkVouch employment table.

## Fields persisted on confirm

| Field | Source |
|-------|--------|
| company_name | User-edited extraction |
| company_normalized | Lowercase company |
| job_title | User-edited extraction |
| start_date | ISO date |
| end_date | ISO date or null |
| is_current | Boolean |
| verification_status | Always `pending` |
| source | `resume` |

## Not persisted

Description, employment type, and job location from parse are shown in review only (no columns on `employment_records`).

## Duplicate detection

Before insert, parse attaches `duplicate_of` when company + title or overlapping dates match an existing record.

On confirm, user chooses:

- **Keep existing** (`skip`)
- **Update existing** (`update`)
- **Create separate** (`create`)

Auto-skip occurs when duplicate is detected and user leaves default `skip`.

## Verification

Records remain **pending** until the existing verification flow completes. Trust never treats them as verified automatically.
