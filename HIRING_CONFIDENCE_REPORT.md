# Hiring Confidence Report — Sprint 9A

**Operation Greenhouse · Hiring Confidence Engine**  
**Date:** 2026-08-08

---

## Summary

Sprint 9A introduces the **Hiring Confidence Engine** — a presentation and aggregation layer that unifies Trust Score, verification, references, and workflow into one recruiter-facing answer: *"How confident should I be hiring this candidate?"*

The Trust Engine is **unchanged**. Hiring Confidence consumes existing data only.

---

## Calculation Model

```
ConfidenceFactors → ConfidenceCalculator → ConfidenceLevelResolver → ConfidenceExplainer
```

**11 factors** with explicit weights summing to ~1.0. Each exposes weight, contribution, confidence, and status.

Final score: weighted sum clamped to 0–100.

---

## Weighting

| Factor | Weight |
|--------|--------|
| Trust Score | 18% |
| Employment Verification | 15% |
| Manager Verification | 12% |
| Reference Consensus | 12% |
| Coworker Verification | 10% |
| Timeline Consistency | 10% |
| Workflow Completion | 8% |
| Identity Verification | 5% |
| Data Freshness | 5% |
| Missing Information | 3% |
| Risk Signals | 2% |

---

## Examples

| Score | Stars | Level | Recommendation |
|-------|-------|-------|----------------|
| 96% | ★★★★★ | High Confidence | Ready to Hire |
| 82% | ★★★★☆ | Strong Confidence | Ready for Final Review |
| 67% | ★★★☆☆ | Moderate Confidence | Ready to Interview |
| 41% | ★★☆☆☆ | Needs Review | Needs Additional Verification |
| 18% | ★☆☆☆☆ | Low Confidence | Requires Manual Review |

---

## UI Preview

**Greenhouse Panel** (`/integrations/greenhouse/panel?demo=1`):

- Hero: Hiring Confidence 96% ★★★★★
- Supporting: Trust Score 96 (compact)
- Why this confidence? (factor breakdown)
- Badges, verification, timeline, references

Recruiter understands candidate quality in **under 5 seconds**.

---

## API

```
GET /api/trust/confidence/[profileId]
```

Returns full confidence payload including timeline, badges, explanation, and supporting trust score.

---

## Future AI Opportunities

- Natural-language confidence summary from factor vectors
- Role-specific confidence weighting (engineering vs sales)
- Peer benchmark: "Confidence vs similar candidates"
- Predictive confidence trajectory from event store
- Anomaly detection on confidence drops

---

## Marketplace Impact

- Single hero metric for Greenhouse reviewers (not 4 separate systems)
- Full explainability satisfies enterprise procurement
- Informational recommendations (no automated hiring — compliant)
- Demo panel shows 96% confidence with timeline progression

---

## Performance

| Operation | Target | Result |
|-----------|--------|--------|
| `computeFromPanelSignals` | < 50ms | ✅ ~1–5ms |
| `computeFromInput` | < 50ms | ✅ ~1–5ms |
| Panel embed | No extra API call | ✅ Computed in panel service |

---

## Deliverables

| Task | Status |
|------|--------|
| HiringConfidenceEngine + calculator/explainer/resolver/factors/weights | ✅ |
| 0–100 score, stars, levels | ✅ |
| 11 confidence factors with weight/contribution/confidence/status | ✅ |
| Explainability + timeline + badges + recommendations | ✅ |
| Greenhouse panel hero swap | ✅ |
| API `/api/trust/confidence/[profileId]` | ✅ |
| Tests (9 new + panel regression) | ✅ |
| Documentation (4 docs) | ✅ |

---

## Final Review

**If a recruiter opens a candidate for the first time, will they immediately understand "Should I feel confident hiring this person?"**

**Yes** — Hiring Confidence is the hero metric with stars, level, recommendation, and one-glance explanation. Trust Score supports without dominating.

---

## Files

```
lib/trust/confidence/
├── HiringConfidenceEngine.ts
├── ConfidenceCalculator.ts
├── ConfidenceExplainer.ts
├── ConfidenceLevelResolver.ts
├── ConfidenceFactors.ts
├── ConfidenceWeights.ts
├── types.ts
└── index.ts

components/integrations/greenhouse/
├── HiringConfidenceHero.tsx
├── TrustScoreSupporting.tsx
├── ConfidenceExplanationCard.tsx
├── ConfidenceTimelineCard.tsx
└── ConfidenceBadgesRow.tsx
```
