# 07 — AI Experience

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## AI Design Principles

1. **AI saves time, never replaces judgment** — Recruiter always decides
2. **Every AI output cites its sources** — "Based on 5 vouches and 2 verified employments"
3. **AI fails silently with fallback** — Show structured data if AI unavailable
4. **No AI on unverified data** — Only verified employment and vouches feed AI
5. **Transparent limitations** — "AI summary · not a hiring recommendation"

---

## AI Features Matrix

| Feature | Location | Input data | Output | Max length |
|---------|----------|-----------|--------|------------|
| **Candidate Summary** | GH Panel | Profile + jobs + vouches | 3-sentence brief | 280 chars |
| **Strength Summary** | GH Panel expand | Vouches + ratings | Bullet strengths | 3 bullets |
| **Risk Summary** | GH Panel expand | Disputes + gaps + flags | Risk flags | 2 bullets max |
| **Leadership Summary** | GH Panel expand | Manager vouches | Leadership assessment | 2 sentences |
| **Would Rehire** | GH Panel | Manager vouch response | Yes/No/Maybe + quote | 1 line |
| **Reference Consensus** | Vouch summary | All vouch ratings | Agreement level | 1 label |
| **Employment Timeline Summary** | Timeline header | Verified jobs | Narrative timeline | 2 sentences |
| **Fraud Detection Alert** | Status card | Overlap anomalies, flags | Alert banner | 1 sentence |

---

## 1. Candidate Summary (Primary — Always Shown)

**Trigger:** Panel load (cached 15 min)

**Example output:**
```
Jane has 4 years of verified experience at Acme Corp as Senior 
Engineer. Strong vouch from direct manager (4.8/5). No disputes 
on record. Would rehire: Yes.
```

**Loading:** "Generating summary..." (max 5s, then show structured fallback)

**Fallback (no AI):**
```
78 Strong · 2 verified employments · 5 vouches · No disputes
```

**Footer:** `Based on verified data · Not a hiring recommendation · [Explain ↗]`

---

## 2. Strength Summary

**Expandable section in panel**

```
▼ Strengths
• Consistently rated 4.5+ across 5 coworker vouches
• Direct manager confirmed employment and would rehire
• 4-year tenure at Acme Corp with no employment gaps
```

---

## 3. Risk Summary

**Only shown if risks detected**

```
▼ Risks  ⚠
• 6-month gap between Beta Inc and Acme Corp (unexplained)
• 1 employment record pending verification
```

**If no risks:** Section hidden (not "No risks found" — absence is the signal)

---

## 4. Leadership Summary

**Shown when manager vouch exists**

```
▼ Leadership
Direct manager rated leadership 5/5 and noted strong team 
cohesion. Would rehire without hesitation.
```

---

## 5. Would Rehire

**Single line in vouch summary**

```
Would rehire: ✓ Yes (manager, Acme Corp)
Would rehire: ? Not stated
Would rehire: ✗ No (see risk summary)
```

---

## 6. Reference Consensus

**Algorithm (non-AI):** Standard deviation of vouch ratings

| Consensus | Label | Visual |
|-----------|-------|--------|
| σ < 0.5 | Strong agreement | Green |
| σ 0.5–1.0 | Moderate agreement | Amber |
| σ > 1.0 | Mixed signals | Red + "Review vouches" |
| n < 2 | Insufficient data | Gray — hidden |

---

## 7. Employment Timeline Summary

**Above timeline visual**

```
Jane's verified career spans 7 years across 2 companies in 
software engineering, with continuous employment since 2017.
```

---

## 8. Fraud Detection Alerts

**Banner at top of panel — only when triggered**

| Alert | Trigger | Message |
|-------|---------|---------|
| Date overlap | Two jobs overlap >30 days | "⚠ Overlapping employment dates detected" |
| Identity mismatch | Email doesn't match GH name | "⚠ Name mismatch between Greenhouse and WorkVouch" |
| Dispute active | Open dispute on record | "⚠ Active employment dispute — review before proceeding" |
| Fraud flag | Admin fraud flag | "⚠ Flagged for review — contact admin" |
| Velocity anomaly | 10+ vouches in 24h | "⚠ Unusual vouch activity detected" |

**Alert behavior:** Amber banner, non-blocking. Recruiter can dismiss. Does not hide trust score.

---

## AI Interaction Patterns

### Refresh
- Manual refresh button on AI summary
- Auto-refresh when trust score changes (background)
- Stale indicator: "Generated 2 hours ago"

### Explain
- "Explain this trust score" → links to `/trust/explain` API prose
- "How is this calculated?" → tooltip with factor breakdown

### Regenerate
- Not exposed to recruiters (consistency > novelty)
- Admin can force regenerate in debug mode

---

## AI in Employer Dashboard (Future)

| Feature | Location | Purpose |
|---------|----------|---------|
| Pipeline trust overview | Enterprise dashboard | Avg trust score of active candidates |
| Risk heatmap | Employer analytics | Candidates with risk flags |
| Predictive insights | Sprint 9+ | "Candidates like Jane typically succeed in this role" |

---

## AI Data Boundaries

| Data | Fed to AI | Never fed |
|------|-----------|-----------|
| Verified employment | ✅ | |
| Vouch ratings (aggregate) | ✅ | |
| Vouch text (individual) | ❌ | Privacy |
| Candidate email | ❌ | |
| Location (city/zip) | ❌ | Privacy policy |
| Dispute details | ✅ (flag only) | |
| Trust score | ✅ | |

---

## Related Documents

- [06-workvouch-panel.md](./06-workvouch-panel.md)
- [14-product-principles.md](./14-product-principles.md)
