# Hidden Culture Systems (Internal Only)

Two internal-only systems for improving match quality and trust. **Never expose labels, scores, or raw data to users or employers.**

## System 1: Job Environment Traits

- **Purpose:** Capture what it feels like to work at a specific job (employment record) from coworker input.
- **Storage:** `job_environment_traits` — rolling aggregates per `job_id` (employment_records.id). No user attribution.
- **Trigger:** Optional casual question after leaving a vouch, confirming a match, or job verification: "Which of these best describe the work environment? (Pick up to 3)."
- **API:** `POST /api/culture/environment-vote` (body: `job_id`, `trait_keys[]`). Caller must be a matched coworker for that job.
- **Internal outputs (not shown):** `environment_fingerprint` (top traits), `environment_confidence_score`, `environment_volatility_flag`. Use via `getEnvironmentFingerprint(jobId)` from `lib/culture/jobEnvironment`.

## System 2: Peer Workstyle Signals

- **Purpose:** Model how a user behaves as a coworker from vouches, disputes, confirmation patterns. Used for trust weighting and match confidence.
- **Storage:** `peer_workstyle_signals` — per user, signal key, confidence, observation count. Signals decay over time.
- **Derivation:** No single vouch creates a signal; pattern repetition required. Called from `processReviewIntelligence` after each reference (`deriveWorkstyleSignalsFromReference`). Dispute resolution can call `deriveWorkstyleSignalsFromDispute`.
- **Internal use only:** `getPeerWorkstyleSignals(userId)` from `lib/culture/peerWorkstyle`. Use probabilistically in matching/trust; never display.

## Safety

- No negative labels shown to users.
- No employer access to raw culture data.
- No scores or ratings exposed in UI.
- All outputs used probabilistically; signals decay.
- Feature-flag ready for future soft insights without schema changes.

## Cursor logic

- **Job culture vote:** Trigger after vouch, coworker confirmation, job verification. Accept up to 3 trait keys; apply trust weighting; update SQL aggregates only. SQL never decides meaning.
- **Coworker signals:** Require minimum 3 observations; detect conflicting signals (reduce confidence, do not penalize); adjust confidence gradually; decay on read only (never in SQL). Cursor must NOT create permanent labels, penalize users, or block actions.
- **Decay:** Decay never lives in SQL. Cursor applies decay on read, or via cron/background job. SQL only stores raw values.
- **Matching:** Use signals probabilistically; adjust ranking only via `getCultureRankingWeight`. Never hard-block; never output a final "fit score".

## Feature flags (hidden)

Defined in `lib/culture/flags.ts`. SQL is unaware.

- `USE_CULTURE_IN_MATCHING`: use culture weight in ranking (default true).
- `SHOW_SOFT_INSIGHTS`: future soft insights to user (default false).
- `SHOW_ENVIRONMENT_SUMMARY`: future environment summary (default false).

## Naming

Neutral internal names only: `job_environment_traits`, `peer_workstyle_signals`, `environment_fingerprint`, `culture_weight_score` (if used).
