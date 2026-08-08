# Hiring Confidence

The Hiring Confidence Engine transforms trust, verification, and reference data into one answer:

**"How confident should I be hiring this candidate?"**

## Architecture

```
Trust Engine (unchanged)
        ↓
HiringConfidenceEngine (presentation layer)
        ↓
Recruiter UI / Greenhouse Panel / API
```

Located at `lib/trust/confidence/`.

## Score

- **Range:** 0–100
- **Display:** Percentage + stars (★★★★★) + level label
- **Does not modify** Trust Engine scoring logic

## Levels

| Score | Stars | Label |
|-------|-------|-------|
| 90–100 | ★★★★★ | High Confidence |
| 75–89 | ★★★★☆ | Strong Confidence |
| 55–74 | ★★★☆☆ | Moderate Confidence |
| 30–54 | ★★☆☆☆ | Needs Review |
| 0–29 | ★☆☆☆☆ | Low Confidence |

## Recommendations (Informational Only)

- Ready to Hire
- Ready for Final Review
- Ready to Interview
- Needs Additional Verification
- Needs Additional References
- Requires Manual Review

Never automates hiring decisions.

## API

```
GET /api/trust/confidence/[profileId]
```

Returns: `confidenceScore`, `confidenceLevel`, `confidenceFactors`, `confidenceTimeline`, `confidenceBadges`, `confidenceExplanation`, `recommendation`, `trustScore`.

## Greenhouse Panel

Hiring Confidence is the **hero metric**. Trust Score appears as a supporting compact row.

## Related

- [confidence-model.md](./confidence-model.md)
- [confidence-ui.md](./confidence-ui.md)
- [explainability.md](./explainability.md)
