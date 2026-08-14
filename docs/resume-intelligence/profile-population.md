# Profile Population

## Principle

Nothing from a resume silently overwrites confirmed profile data.

## Flow

1. Parse returns identity fields with confidence
2. User reviews in **Personal information** section
3. User opts in via **Update my profile with confirmed fields**
4. Confirm sends `identity: { apply: true, ... }`

## Fields updated (when apply=true)

| Field | Notes |
|-------|-------|
| full_name | Only if profile name is empty |
| city | User-confirmed |
| state | User-confirmed |
| location | Composed from city, state, country |

## Not stored on profile

- Phone (no profile column; shown for review only)
- Email (auth email unchanged)
- Street address / ZIP (never stored from resume)

## Employment

Employment populates `employment_records`, not profile columns.
