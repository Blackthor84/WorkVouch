# Confidence UI

## Greenhouse Embedded Panel

### Hero: Hiring Confidence

```
Hiring Confidence
96%
★★★★★
High Confidence
Ready to Hire
```

Informational disclaimer always visible.

### Supporting: Trust Score

Compact row below hero:

```
Trust Score    96
Band           Exceptional
```

### Sections (in order)

1. Hiring Confidence Hero
2. Trust Score (supporting)
3. Why this confidence? (explanation + factors)
4. Badges (earned only)
5. Verification Status
6. Workflow Status
7. Confidence Timeline
8. Employment Timeline
9. Reference Summary
10. Hiring Intelligence

## Components

| Component | Path |
|-----------|------|
| `HiringConfidenceHero` | `components/integrations/greenhouse/HiringConfidenceHero.tsx` |
| `TrustScoreSupporting` | `components/integrations/greenhouse/TrustScoreSupporting.tsx` |
| `ConfidenceExplanationCard` | `components/integrations/greenhouse/ConfidenceExplanationCard.tsx` |
| `ConfidenceTimelineCard` | `components/integrations/greenhouse/ConfidenceTimelineCard.tsx` |
| `ConfidenceBadgesRow` | `components/integrations/greenhouse/ConfidenceBadgesRow.tsx` |

## Employer Dashboard

Existing `HiringConfidenceCard` at `/api/employer/confidence/[id]` remains unchanged. Sprint 9A adds the numeric engine; future sprint can wire the card to the new API.

## Accessibility

- `aria-label` on confidence percentage and star rating
- Informational disclaimer for recommendation
- Expandable sections with `aria-expanded`
- Keyboard focus rings on all interactive elements

## Performance

Panel confidence computed synchronously from cached panel signals — no additional API round-trip in embed.

Profile API: `GET /api/trust/confidence/[profileId]` for full computation with DB load.
