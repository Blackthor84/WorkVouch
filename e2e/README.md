# Employee Trust E2E Suite

End-to-end tests that **guarantee the system cannot lie to employees**. No mocks; real data and real APIs.

## Requirements

- **E2E_TEST_SECRET**: Set to a secret string (min 16 chars). Gates test-only API routes. When running `npm run e2e`, the config passes a default if unset.
- **Test users**: Create one employee and one employer in your (test) Supabase project with known credentials. Set:
  - `E2E_EMPLOYEE_EMAIL`, `E2E_EMPLOYEE_PASSWORD`
  - `E2E_EMPLOYER_EMAIL`, `E2E_EMPLOYER_PASSWORD`
- **Scenario B**: The employee user should have **no verified employment in the last 200 days** (or no verified employment at all) and no recent references, so that initial trust trajectory is `at_risk`. Otherwise the first assertion fails.

## Run

```bash
# Install deps (includes @playwright/test)
npm install

# Start app (or let Playwright start it via webServer)
# Set env: E2E_TEST_SECRET, E2E_EMPLOYEE_EMAIL, E2E_EMPLOYEE_PASSWORD, E2E_EMPLOYER_EMAIL, E2E_EMPLOYER_PASSWORD
npm run e2e
```

## Scenarios

| Scenario | What it proves |
|----------|----------------|
| **A** | Employer View Mirror payload (employee “view as employer”) is **identical** to employer view of same profile. |
| **B** | Trust trajectory is `at_risk` when data says so; after adding a verified employment event it becomes `improving`. Never “improving” with an unresolved dispute. |
| **C** | Archiving a job (visibility off) removes it from employer view / search / credential. |
| **D** | Every trust-affecting event appears on the Trust Activity timeline with type, impact, and date. |
| **E** | Reference badges (Direct Manager, Repeated Coworker, Verified Match) only appear when conditions are met. |
| **F** | Revoking a credential makes the share link return 404 immediately. |

## Files

- `e2e/employee-trust.e2e.ts` — All six scenarios.
- `e2e/fixtures/payload-types.ts` — Payload types and `payloadsIdentical()` for Scenario A.
- `app/api/e2e/*` — Test-only routes (gated by `E2E_TEST_SECRET`): profile payload, trust trajectory, employer view of candidate, seed verified employment.
