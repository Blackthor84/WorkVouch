# Confidence Model

Presentation-layer aggregation — consumes existing Trust Engine output without modifying it.

## Modules

| Module | Role |
|--------|------|
| `HiringConfidenceEngine` | Orchestrates computation |
| `ConfidenceFactors` | Builds 11 factor signals |
| `ConfidenceCalculator` | Weighted sum → 0–100 |
| `ConfidenceLevelResolver` | Level, stars, recommendation |
| `ConfidenceExplainer` | Explanation, timeline, badges |
| `ConfidenceWeights` | Factor weight constants |

## Factors

| Factor | Weight | Source |
|--------|--------|--------|
| Trust Score | 0.18 | `calculateTrust()` |
| Employment Verification | 0.15 | Verified employment count |
| Manager Verification | 0.12 | Manager reference count |
| Coworker Verification | 0.10 | Coworker reference count |
| Reference Consensus | 0.12 | Completion + consensus |
| Timeline Consistency | 0.10 | Employment timeline confidence |
| Identity Verification | 0.05 | Employment verified proxy |
| Workflow Completion | 0.08 | Lifecycle step completion |
| Data Freshness | 0.05 | Last sync / trust update age |
| Missing Information | 0.03 | Gap penalty |
| Risk Signals | 0.02 | Fraud flags + disputes |

Each factor exposes:

- `weight` — model weight
- `contribution` — points toward 0–100 score
- `confidence` — factor reliability 0–1
- `status` — positive / neutral / negative / missing

## Calculation

```
confidenceScore = clamp(0, 100, Σ factor.contribution)
```

Contributions = `normalizedSignal × weight × 100`

## Timeline

Confidence progression inferred from workflow milestones:

1. Application Imported (~60% of final)
2. Verification Complete (~79%)
3. References Complete (~94%)
4. Trust Updated (100%)

## Badges (Earned Only)

- High Confidence (score ≥ 90)
- Verified Employment
- Verified Managers
- Verified Coworkers
- Strong References
- Recently Verified (data ≤ 72h old)

## Example

Strong candidate (trust 96, verified, 5 references):

```
Hiring Confidence: 91%
★★★★★ High Confidence
Recommendation: Ready to Hire

✓ Employment Verified (+14)
✓ Manager Verification (+11)
✓ Coworker Consensus (+9)
...
No significant risk signals detected.
```

Trust Score (96) shown separately as supporting metric.
