# ROI Calculations

Conservative estimates for Customer Success and sales demos. Constants in `ROI_CONSTANTS`.

## Time Savings Model

| Manual Task | Minutes Saved | Trigger |
|-------------|---------------|---------|
| Manual candidate invite | 15 | Automated invitation sent |
| Verification follow-up | 20 | Verification completed |
| Reference chase | 25 | References completed |
| Manual sync | 30 | (sync operations) |

## ROI Metrics

| Metric | Calculation |
|--------|-------------|
| `hoursSaved` | Sum of manual task minutes × automated candidates ÷ 60 |
| `manualTasksEliminated` | Automated candidates × tasks per candidate |
| `averageTimeSavedPerCandidateMs` | Total ms saved ÷ automated candidates |
| `candidatesProcessedAutomatically` | Candidates with automated invitation |
| `manualFollowUpReductionRate` | automationTriggerRate × automationSuccessRate |
| `automationCoverageRate` | Automated candidates ÷ total candidates |

## Example

10 candidates auto-invited in 30 days:

- Invite savings: 10 × 15 min = 150 min (2.5 hours)
- 3 verifications completed: 3 × 20 min = 60 min (1 hour)
- **Total: ~3.5 hours saved**

## Customer Success Usage

```
"Our Greenhouse integration saved your team 12.5 hours last month
by automatically inviting 47 candidates at final interview stage.
Verification completion rate: 78%. Average time to invite: 4 minutes."
```

## Sales Demo Talking Points

1. **Speed** — "WorkVouch invites candidates within minutes of reaching your configured stage"
2. **Coverage** — "X% of candidates processed without recruiter intervention"
3. **Trust** — "Y% verification completion rate"
4. **ROI** — "Z hours saved per month"

## Future Refinement

ROI constants will be configurable per employer tier. AI optimization (Sprint 9+) will use these metrics to tune automation triggers.
