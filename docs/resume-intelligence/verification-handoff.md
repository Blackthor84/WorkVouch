# Verification Handoff

## After confirm

`POST /api/resume/confirm` returns:

```json
{
  "verification_url": "/dashboard?openVerification=1"
}
```

## UI

Import success screen offers **Start verification**, opening the existing `VerificationRequestModal` on the dashboard.

## Match employment

Each new pending record triggers `POST /api/match-employment` for coworker discovery (existing flow).

## Boundary

| Stage | Status |
|-------|--------|
| Resume parse | Not stored as employment |
| User confirm | `verification_status = pending` |
| Verification complete | `verified` (existing engine) |
| Trust | Uses verified only |

Do not create a parallel verification engine for resumes.
