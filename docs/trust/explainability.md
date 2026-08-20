# Hiring Confidence Explainability

Every confidence score is fully explainable. No black boxes.

## Principle

> Trust Score powers the engine. Hiring Confidence powers the experience.

Recruiters see **why**, not just **what**.

## Explanation Format

```
Hiring Confidence 91% — High Confidence

✓ Employment Verified (+14)
✓ Manager Verification (+11)
✓ Coworker Consensus (+9)
✓ Timeline Consistency (+9)
✓ Reference Consensus (+11)
✓ Trust Score (+17)

No significant risk signals detected.
```

## Factor Detail

Each factor in `confidenceFactors[]`:

```json
{
  "id": "employment_verification",
  "label": "Employment Verified",
  "weight": 0.15,
  "contribution": 14,
  "confidence": 0.95,
  "status": "positive"
}
```

## Negative Signals

When present:

```
○ Missing Information — additional data recommended
3 risk signal(s) detected
```

Open disputes force `Requires Manual Review` recommendation.

## Timeline Explainability

```
Application Imported     58%
↓
Verification Complete    76%  (+18)
↓
References Complete      90%  (+14)
↓
Trust Updated            96%  (+6)
```

Shows **why confidence increased** at each milestone.

## Trust Score Relationship

Trust Score appears as a **factor** and **supporting metric**, not the hero.

Explainability card shows trust contribution alongside verification and reference factors.

## API

Full explanation in:

```
GET /api/trust/confidence/[profileId]
→ confidenceExplanation: string[]
→ confidenceFactors: ConfidenceFactor[]
```

## Constraints

- Does not expose raw Trust Engine weights or internal formulas beyond presentation weights
- Does not automate hiring — recommendations are informational
- Does not modify Trust Engine, Verification Engine, or Billing
