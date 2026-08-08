# 14 — Product Principles

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## WorkVouch Integration Product Principles

These 15 principles govern every design decision for the ATS Integration Platform and all WorkVouch product experiences.

---

### 1. Never Interrupt Recruiter Workflow
Recruiters live in Greenhouse. WorkVouch meets them there — embedded panel, no mandatory context switch. Full WorkVouch profile is optional, never required.

### 2. Never Require Duplicate Data Entry
If Greenhouse has the candidate's email, WorkVouch uses it. If work history exists in WorkVouch, don't ask the candidate to re-enter it. Sync, don't duplicate.

### 3. Always Automate When Possible
Auto-link by email. Auto-export trust scores. Auto-invite at the right pipeline stage. Manual steps are failures of automation design.

### 4. Always Explain Trust Scores
Every trust score display includes a band label (Low / Moderate / Strong / Exceptional) and a one-line explanation. Recruiters never see a number without context.

### 5. Always Preserve User Privacy
Candidates control profile visibility. Vouch text is never exported to ATS. Location data is country/state only. Reference providers are never exposed to employers without consent.

### 6. Fail Gracefully, Recover Transparently
Integration failures never break Greenhouse or WorkVouch core flows. Every failure has a visible status, a clear message, and a one-click recovery action.

### 7. Show Status, Never Hide Progress
Every async operation (sync, export, verification) shows progress. Recruiters and admins always know what's happening and when it last succeeded.

### 8. Respect the Candidate's Time
Verification flows complete in <10 minutes. Vouch requests complete in <3 minutes. Reminders are helpful, not nagging (max 3 reminders, then stop).

### 9. Earn Trust Through Transparency
Employers see exactly what data flows to Greenhouse. Candidates see exactly who can view their profile. No hidden data sharing.

### 10. Design for the 80% Case First
Optimize for: recruiter opens candidate → sees trust score → makes decision. Edge cases (manual link, ambiguous email) are handled but not primary UX.

### 11. One Click for Common Actions
Link candidate: one click. Export trust score: automatic. Request verification: one click. Reconnect OAuth: one click. Reduce friction relentlessly.

### 12. Consistent Language Everywhere
Trust score (not Reputation Score). Work history (not Job History). Verification request (not Reference request). Vouch (not Review). Same words in GH panel, WorkVouch app, and emails.

### 13. Mobile-First for Candidates and References
Candidates and reference providers complete flows on mobile. Employer and recruiter experiences are desktop-first but responsive.

### 14. Celebrate Completion
Every completed verification, vouch, and profile milestone gets a positive confirmation moment. Building a verified profile should feel rewarding.

### 15. Integration Is Infrastructure, Not a Feature
The best integration is invisible. Employers connect once, candidates get verified, recruiters see trust data — without anyone thinking about "the integration."

---

## Principle Application Matrix

| Principle | Recruiter | Employer | Candidate | Reference |
|-----------|-----------|----------|-----------|-----------|
| Never interrupt workflow | ✅ GH panel | — | — | — |
| No duplicate data entry | ✅ Auto-link | ✅ Auto-sync | ✅ Pre-fill | ✅ Pre-fill context |
| Automate when possible | ✅ Auto-export | ✅ Auto-invite | ✅ Auto-match | — |
| Explain trust scores | ✅ Band + tooltip | ✅ Dashboard | ✅ Coaching | — |
| Preserve privacy | ✅ No vouch text | ✅ Settings | ✅ Visibility | ✅ Anonymous option |
| Fail gracefully | ✅ Stale badge | ✅ Health dash | ✅ Retry | ✅ New link |
| Show status | ✅ Sync timestamp | ✅ Sync log | ✅ Progress bar | ✅ Confirmation |
| Respect time | ✅ <60s eval | ✅ <5min setup | ✅ <10min verify | ✅ <3min vouch |
| Transparency | ✅ Data shown | ✅ Sync prefs | ✅ Who sees what | ✅ Impact shown |
| 80% case first | ✅ Linked view | ✅ Connected | ✅ Guided flow | ✅ Quick vouch |
| One click | ✅ All actions | ✅ Connect | ✅ Invite | ✅ Submit |
| Consistent language | ✅ All copy | ✅ All copy | ✅ All copy | ✅ All copy |
| Mobile-first | — | Responsive | ✅ Primary | ✅ Primary |
| Celebrate completion | — | ✅ Connected | ✅ Score up | ✅ Thank you |
| Invisible integration | ✅ GH panel | ✅ Set & forget | ✅ Seamless | ✅ Email only |

---

## Anti-Patterns (Never Do)

| Anti-pattern | Why forbidden |
|--------------|---------------|
| Modal interrupting GH workflow | Breaks principle 1 |
| Asking candidate to re-enter GH data | Breaks principle 2 |
| Manual trust export as default | Breaks principle 3 |
| Trust score without band label | Breaks principle 4 |
| Exporting vouch text to ATS | Breaks principle 5 |
| Silent sync failure | Breaks principle 6 |
| Spinner with no message | Breaks principle 7 |
| 5+ step verification for references | Breaks principle 8 |
| Hidden data sharing settings | Breaks principle 9 |

---

## Related Documents

- [15-wow-moments.md](./15-wow-moments.md)
- [final-product-review.md](./final-product-review.md)
