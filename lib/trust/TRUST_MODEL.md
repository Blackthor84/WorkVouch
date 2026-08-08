# Trust Score Model (Consolidated)

Single source of truth for production trust display: **`lib/trust/trustEngine.ts`** → **`calculateTrust(profileId)`**.

Recalculation/persistence: **`lib/trustScore.ts`** → **`calculateCoreTrustScore(userId)`** (v1 intelligence engine).

---

## Production score (persisted)

| Source | Field | Range |
|--------|-------|-------|
| `trust_scores.score` | Canonical displayed score | 0–100 |
| `trust_scores.job_count` | Verified employment count | int |
| `trust_scores.reference_count` | Reference count | int |
| `trust_scores.average_rating` | Avg reference rating | 0–5 |

**Recalculation formula:** `calculateProfileStrength("v1", input)` from `@/lib/core/intelligence`.  
Inputs built via `buildProductionProfileInput(userId)`.

### Component signals (display / explain only)

Fetched by `getTrustScoreComponents(userId)`:

| Component | Source |
|-----------|--------|
| `verifiedEmployments` | `employment_records` where `verification_status = verified` |
| `totalVerifiedYears` | Sum of verified employment date ranges |
| `referenceCount` | `employment_references` for user |
| `averageReferenceRating` | Mean rating from references |
| `uniqueEmployersWithReferences` | Distinct employers linked via references |
| `fraudFlagsCount` | Open fraud/dispute flags |

---

## Event-based fallback (when persisted score is 0)

`lib/trust/eventEngine.ts` sums `trust_events.impact_score`, normalized to 0–100.

Used for band/trajectory when events exist but row not yet persisted.

---

## Legacy event counting (deprecated shims)

Previously in `lib/trust/getTrustScore.ts` and `lib/trust/trustScore.ts`:

- Base 50
- +5 per coworker verification
- +10 per manager/employment verification
- +2 per network connection (trustScore.ts only)
- −10 per employment dispute

These now delegate to **`calculateTrust()`** which prefers persisted score.

---

## Trajectory (not a score weight)

`lib/trust/trustTrajectory.ts` — deterministic rules:

- **improving:** recent verification/reference, no open dispute
- **at_risk:** open dispute or stale verification activity
- **stable:** otherwise

---

## Industry weights (employer view only)

`lib/trustScoreWeights.ts` — re-weights component *display* for employer industry context.  
Does not change stored `trust_scores.score`.

---

## Badges (derived, no extra math)

Built in `buildTrustBadges()` from component thresholds:

- Verified Employment — ≥1 verified job
- Verified Professional — ≥1 reference
- Strong Verifications — ≥3 references
- Long-Term Employee — ≥3 verified years
- Complete Profile — verified job + reference, no fraud flags

---

## Explanation lines

Built in `buildTrustExplanation()` from existing component values only.  
No invented weights — mirrors what users already see in breakdown UIs.

---

## What NOT to use for production display

| File | Purpose |
|------|---------|
| `lib/trust/engine.ts` | Admin playground simulation |
| `lib/trust/calculateTrust.ts` | Playground snapshot |
| `lib/trust-score.ts` | Legacy tier-based formula |
| `lib/trust/explainTrustScore.ts` | Simulation snapshot explainability |

---

## API

| Endpoint | Status |
|----------|--------|
| `GET /api/trust/[userId]` | **Canonical** — full bundle |
| `GET /api/trust/me` | Alias for current user |
| `GET /api/trust/score` | Legacy — score + components |
| `GET /api/trust/score/[profileId]` | Legacy — score + band |
| `GET /api/trust/explain` | Legacy — intelligence snapshot factors |
| `GET /api/trust/timeline/[profileId]` | Timeline events (included in canonical) |
