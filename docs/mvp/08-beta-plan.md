# 08 — Beta Plan

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07

---

## Beta Overview

| Attribute | Value |
|-----------|-------|
| **Duration** | 2 weeks |
| **Start** | After V1 feature-complete + internal QA pass |
| **End** | Before marketplace submission |
| **Customers** | 3–5 |
| **Feature flag** | `integration_greenhouse_beta` |
| **Support** | Dedicated Slack channel + weekly call |

---

## Customer Selection

### How Many

| Tier | Count | Purpose |
|------|-------|---------|
| **Design partners** | 2 | Deep feedback; weekly calls; tolerate bugs |
| **Beta testers** | 2–3 | Real-world usage; less hand-holding |
| **Total** | 3–5 | Sufficient for confidence; manageable support load |

### Which Industries

| Industry | Priority | Rationale |
|----------|----------|-----------|
| **Technology / SaaS** | P0 | Primary GH customer base; high hiring volume |
| **Professional services** | P1 | Verification-heavy; trust score value high |
| **Healthcare** | P2 | Compliance-driven; may have longer sales cycle |

**Avoid for beta:** Government (procurement delays), retail (low GH adoption), companies with <50 employees (insufficient candidate volume).

### Selection Criteria

| Criterion | Required |
|-----------|----------|
| Active Greenhouse customer (Enterprise or Plus plan) | Yes |
| Existing WorkVouch employer account | Yes |
| Willing to connect production GH (or dedicated sandbox org) | Yes |
| ≥20 active candidates in GH pipeline | Yes |
| Designated admin contact for feedback | Yes |
| Willing to join 30-min weekly feedback call | Preferred |
| NDA / beta agreement signed | Yes |

### Recruitment Sources

1. Existing WorkVouch enterprise customers who use Greenhouse
2. Greenhouse partnership team referrals
3. Direct outreach to GH customers in WorkVouch network
4. Demo environment visitors who express interest

---

## Beta Timeline

```
Week -2:  Recruit beta customers; sign agreements
Week -1:  Feature-complete; internal QA; deploy to staging
Week 1:   Beta launch — enable feature flag; onboarding calls
Week 2:   Feedback collection; bug fixes; iteration
Week 3:   Beta exit review; marketplace submission prep
```

---

## Onboarding (Per Customer)

| Step | Duration | Owner |
|------|----------|-------|
| 1. Kickoff call (30 min) | Day 1 | CS + Engineering |
| 2. Enable feature flag | Day 1 | Engineering |
| 3. Admin connects Greenhouse | Day 1 | Customer |
| 4. Verify initial sync | Day 1 | Engineering (monitor) |
| 5. Recruiter training (panel walkthrough) | Day 2 | CS |
| 6. Check-in call | Day 5 | CS |
| 7. Weekly feedback call | Day 7, 14 | Product |

---

## Feedback Schedule

| Method | Frequency | Content |
|--------|-----------|---------|
| **Weekly call** | 1× per week | Open feedback; screen share panel usage |
| **Structured survey** | End of Week 1 and Week 2 | 10 questions (see below) |
| **Bug reports** | Ad hoc | Slack channel or email |
| **Usage analytics** | Daily (automated) | Connection, sync, panel view metrics |
| **Support tickets** | Ad hoc | Tagged "beta" in support system |

### Survey Questions (1–5 scale)

1. How easy was it to connect Greenhouse? (1=very difficult, 5=very easy)
2. How useful is the trust score in the Greenhouse panel? (1=not useful, 5=very useful)
3. How reliable has the integration been? (1=unreliable, 5=very reliable)
4. Would you recommend this integration to a colleague? (1=no, 5=definitely)
5. How likely are you to continue using this after beta? (1=unlikely, 5=very likely)
6. Open: What would make this integration more valuable?
7. Open: What frustrated you?
8. Open: What feature is missing that you expected?

---

## Bug Reporting

| Severity | Definition | Response SLA | Example |
|----------|-----------|-------------|---------|
| **P0 Critical** | Integration down; data loss | 2 hours | OAuth broken; all syncs failing |
| **P1 High** | Feature broken; workaround exists | 8 hours | Panel not loading; manual link fails |
| **P2 Medium** | Degraded experience | 24 hours | Stale badge not updating; slow panel |
| **P3 Low** | Cosmetic; minor | Next sprint | Typo; color mismatch |

**Channel:** Dedicated Slack channel `#greenhouse-beta` or email to support@workvouch.com with `[BETA]` prefix.

---

## Exit Criteria

All must be true to exit beta and proceed to marketplace submission:

| Criterion | Target |
|-----------|--------|
| Beta customers connected and syncing | ≥3 |
| Connection success rate | ≥95% |
| Sync success rate | ≥95% |
| P0 bugs open | 0 |
| P1 bugs open | 0 |
| Beta satisfaction (survey avg) | ≥4.0/5.0 |
| At least 1 customer actively using panel daily | Yes |
| Trust scores exported to GH custom fields | Verified by ≥2 customers |
| Feedback incorporated into V1.1 patch list | Documented |
| Support runbook validated | At least 1 real ticket resolved |

---

## Beta → Launch Transition

```
Beta exit criteria met
  → Fix any V1.1 patch items (max 3 days)
  → Enable feature flag for all customers
  → Submit marketplace listing
  → Announce launch
  → Transition beta customers to standard support
```

---

## Related Documents

- [04-launch-checklist.md](./04-launch-checklist.md)
- [07-success-metrics.md](./07-success-metrics.md)
- [10-final-go-no-go.md](./10-final-go-no-go.md)
