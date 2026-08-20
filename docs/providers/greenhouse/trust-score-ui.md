# Trust Score UI — Greenhouse Panel

Every trust score in the embedded panel must explain itself.

## Display

```
Trust Score
96 / 100
Exceptional
```

Uses `WvTrustScore` ring gauge inside a light-themed card for Greenhouse compatibility.

## Explainability Card

Each factor shows:

| Field | Description |
|-------|-------------|
| Label | Human-readable factor name |
| Weight | Percentage of total score model |
| Contribution | Points contributed to score |
| Confidence | Model confidence (0–100%) |
| Status | positive / neutral / negative |

### Default Factors

1. Employment Verified
2. Manager Consensus
3. Coworker Consensus
4. Tenure Consistency
5. Reference Quality
6. Identity Verification
7. No Risk Signals

Built by `buildTrustExplainability()` in `lib/integrations/greenhouse/panel/explainability.ts` from existing `TrustScoreComponents` — no new trust engine weights.

## Band Colors

| Band | Score | Color |
|------|-------|-------|
| Low | 0–39 | Red |
| Moderate | 40–59 | Amber |
| Strong | 60–79 | Blue/Green accent |
| Exceptional | 80–100 | Green |

## Accessibility

- Trust ring has `aria-label="Trust score N out of 100"`
- Factor list uses semantic `<ul>` with readable labels
- Weight/contribution/confidence exposed to screen readers via `<dl>`

## Data Source

When candidate is linked to a WorkVouch profile:

```
calculateTrust(profileId) → buildTrustExplainability(score, components)
```

Demo/marketplace mode uses `buildDemoExplainability(96)`.
