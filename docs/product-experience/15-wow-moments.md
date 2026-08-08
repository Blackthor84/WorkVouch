# 15 — Wow Moments

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## Design Goal

Moments that make recruiters stop and say **"Wow."** — then keep using WorkVouch every day.

Each moment should be **instant**, **visible**, and **effortless** for the recruiter.

---

## The 25+ Wow Moments

### Trust & Verification

**1. One-Click Verification**
Recruiter clicks "Request verification" in GH panel → candidate gets email → manager confirms → trust score updates in panel automatically. Zero follow-up.

**2. Trust Score Appears in Greenhouse Custom Field**
Recruiter opens candidate list in GH → trust score column visible alongside name and stage. No clicking required.

**3. Verified Badge on First Employment**
Candidate's first employment verified → green checkmark animates in → trust score jumps from "Insufficient" to a number. Recruiter sees it live.

**4. "Would Rehire: Yes" from Manager**
Panel shows manager's direct answer without recruiter ever picking up the phone. One line. Definitive.

**5. Trust Score Band Label**
Not just "78" — "78 · Strong" with color. Recruiter instantly knows what it means without training.

---

### AI & Intelligence

**6. AI Summary in Seconds**
Recruiter opens candidate → AI summary already loaded: "6 years verified experience, strong vouch consensus, would rehire: Yes." 3 sentences. Decision-ready.

**7. Risk Flag Without Asking**
Panel silently shows amber banner: "6-month employment gap detected." Recruiter didn't have to ask. AI found it.

**8. Reference Consensus Score**
"5 vouches · Strong agreement (σ 0.3)" — recruiter knows references align without reading each one.

**9. Employment Timeline Narrative**
"Jane's verified career spans 6 years across 2 companies in software engineering, with continuous employment since 2018." Above the visual timeline.

**10. Fraud Detection Alert**
Overlapping employment dates flagged automatically. Recruiter sees it before making an offer.

---

### Automation & Speed

**11. Auto-Link on Application**
Candidate applies in Greenhouse → WorkVouch auto-links by email → panel populated before recruiter opens candidate.

**12. Auto-Invite at Final Interview**
Candidate moves to Final Interview stage → invitation sent automatically → no recruiter action needed.

**13. Real-Time Score Sync**
Candidate completes vouch on phone → trust score updates in GH panel within 30 seconds. Recruiter refreshes → score changed.

**14. Zero Data Entry for Recruiter**
Recruiter never types candidate email, job title, or company. Everything pre-filled from Greenhouse.

**15. Batch Trust Export**
847 candidates linked → trust scores exported to GH custom fields in one sync. Recruiter sees scores in list view immediately.

---

### Visual & UX

**16. Employment Timeline Visualization**
Horizontal timeline with verified jobs as green blocks, gaps as gray, pending as amber. Scannable in 2 seconds.

**17. Trust Score Trend Arrow**
Score went from 65 → 78 in last week. Green up arrow. Recruiter sees momentum.

**18. Progress Ring on Panel Load**
Panel loads with subtle progress ring → resolves to trust score. Feels fast even when fetching.

**19. Sync Badge Confidence**
"Synced 2m ago" green dot. Recruiter trusts the data is current without thinking about it.

**20. Collapsed Panel, Expanded Insight**
Default panel is compact (score + status). Recruiter expands AI summary or timeline only when needed. Information density without overwhelm.

---

### Candidate & Reference Delight

**21. Candidate Completion Celebration**
Candidate finishes profile → confetti + "Your trust score is now Strong (78)" → shareable moment. Candidate tells friends → organic growth.

**22. Reference Vouch in 3 Minutes**
Reference provider opens email on phone → rates → submits → "Thank you! Jane's trust score increased." No account. No friction.

**23. Trust Score Coaching**
Candidate dashboard shows: "Add 1 more vouch to reach Strong band." Actionable, motivating, specific.

**24. Vouch Received Notification**
Candidate gets email: "Sarah vouched for you! Your trust score increased to 78." Immediate gratification.

---

### Employer & Admin

**25. One-Click Greenhouse Connect**
Admin clicks "Connect Greenhouse" → OAuth → connected → initial sync starts → "847 candidates linked" in 2 minutes. Setup complete.

**26. Integration Health at a Glance**
Dashboard shows three green dots: Sync · Export · Webhooks. Admin knows everything is healthy in 1 second.

**27. Automation Preset Selection**
Admin picks "Standard" preset → all automation configured. No 20-field form.

**28. Weekly Digest Email**
"12 candidates verified this week · 847 linked · 0 errors." Admin feels in control without logging in.

---

### Competitive & Predictive (Future Wow)

**29. Side-by-Side Trust Comparison**
Recruiter compares two Final Interview candidates → trust scores, vouch counts, and AI summaries visible side by side in GH.

**30. Predictive Hiring Insight**
"Candidates with trust scores above 75 in this role have 3x offer acceptance rate." Data-driven wow.

**31. Pipeline Trust Overview**
Employer dashboard: "Average trust score of active candidates: 72 Strong." Macro view of hiring quality.

**32. Verified Worker Badge on GH Profile**
Greenhouse candidate profile shows WorkVouch verified badge — visible to entire hiring team, not just panel users.

---

## Wow Moment Priority Matrix

| Moment | Recruiter impact | Implementation effort | Priority |
|--------|-----------------|----------------------|----------|
| AI summary in seconds | ★★★★★ | Medium | P0 |
| Trust score in GH custom field | ★★★★★ | Low | P0 |
| One-click verification | ★★★★★ | Low | P0 |
| Auto-link on application | ★★★★☆ | Medium | P0 |
| Would rehire signal | ★★★★★ | Low | P0 |
| Employment timeline visual | ★★★★☆ | Medium | P1 |
| Auto-invite at stage | ★★★★☆ | Medium | P1 |
| Real-time score sync | ★★★★☆ | Medium | P1 |
| Risk flag (AI) | ★★★★☆ | High | P1 |
| Candidate celebration | ★★★☆☆ | Low | P2 |
| Reference 3-min vouch | ★★★☆☆ | Low | P2 |
| One-click GH connect | ★★★★☆ | Low | P0 |
| Automation presets | ★★★☆☆ | Low | P2 |
| Side-by-side comparison | ★★★★☆ | High | P3 |
| Predictive insights | ★★★★☆ | High | P3 |

---

## Wow Moment Testing Protocol

For each wow moment, validate in user testing:

1. **Time to value:** How long from trigger to visible result?
2. **Discoverability:** Does the recruiter find it without training?
3. **Emotional response:** Does the recruiter react positively (verbal or behavioral)?
4. **Repeatability:** Does it wow every time, or only the first time?

**Target:** 8 of top 10 P0/P1 moments validated in testing before Marketplace submission.

---

## Anti-Wow (What Kills the Moment)

| Anti-pattern | Why it kills wow |
|-------------|-----------------|
| Panel takes >5s to load | Recruiter closes tab |
| AI summary generic/vague | "Candidate has experience" — useless |
| Trust score with no explanation | Number without context creates distrust |
| Manual data entry required | Breaks "native to Greenhouse" promise |
| Email-only workflow for recruiter | Forces context switch |
| Error with no recovery | Recruiter gives up |
| Stale data with no indicator | Recruiter makes decision on bad data |

---

## Related Documents

- [02-recruiter-experience.md](./02-recruiter-experience.md)
- [06-workvouch-panel.md](./06-workvouch-panel.md)
- [07-ai-experience.md](./07-ai-experience.md)
- [13-marketplace-demo.md](./13-marketplace-demo.md)
- [14-product-principles.md](./14-product-principles.md)
