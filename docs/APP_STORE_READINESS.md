# App Store readiness (resume & trust pipeline)

Checklist for the resume ingestion → employment → coworker matches → reviews → trust score flow.

## Confirmed

- **No background data scraping** — Data comes from user uploads (resume) and user-initiated actions only.
- **No unsolicited messages** — Coworker matching does not auto-send messages; "Request review" and "Leave review" are explicit user actions only.
- **All reviews are user-initiated** — Reviews are created only when the user submits the review form (e.g. from Coworker Matches); no auto-created reviews.
- **Resume parsing disclosed in UI** — Resume upload flow and import UI describe parsing and use of employment data.
- **Fake/demo data only in sandbox** — Single env: `APP_MODE` (`NEXT_PUBLIC_APP_MODE`). Demo seed, synthetic resumes, and sandbox-only APIs gated by `APP_MODE === "sandbox"`. Production UI renders only real DB data (no mock cards, no placeholder stats).
- **Single execution path** — Core logic in `/lib/core/`; resume, reviews, trust score run identically in sandbox and production (see `docs/SANDBOX_CONTRACT.md`).

## To confirm / optional

- **Privacy policy** — Add a short reference to resume upload and parsing (how employment data is extracted and used). See `docs/legal/PRIVACY_POLICY.md`.

## Admin audit

Admins can answer "Why does this user have this score?" via:

- **Admin → Users → [User] → Audit Chain** tab: resume uploads, parsed employment entries, coworker matches, reviews sent/received, trust score history.

## Trust score

- Reviews update trust score deterministically via `recalculateTrustScore`; history is stored in `intelligence_score_history` (entity_type = trust_score) and is traceable.
