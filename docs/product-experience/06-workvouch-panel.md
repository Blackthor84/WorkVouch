# 06 — WorkVouch Panel (Greenhouse Embedded)

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## Design Goal

> The recruiter never leaves Greenhouse. WorkVouch feels like a native Greenhouse feature — not a third-party iframe bolted on.

**Delivery mechanism (engineering):** Greenhouse Custom Field iframe OR Greenhouse partner sidebar extension. Product design is agnostic — UX spec applies to both.

---

## Panel Anatomy

```
┌─────────────────────────────────────┐
│ HEADER                              │
│  WorkVouch logo · Sync badge · [↗]  │
├─────────────────────────────────────┤
│ STATUS CARD                         │
│  Link status · Verification badge   │
├─────────────────────────────────────┤
│ TRUST SCORE (hero)                  │
│  Score · Band · Trend arrow         │
├─────────────────────────────────────┤
│ QUICK INDICATORS                    │
│  ● Verified  ● Vouches  ○ Pending   │
├─────────────────────────────────────┤
│ AI SUMMARY (collapsed default)      │
├─────────────────────────────────────┤
│ EMPLOYMENT TIMELINE (collapsed)     │
├─────────────────────────────────────┤
│ REFERENCE SUMMARY (collapsed)       │
├─────────────────────────────────────┤
│ VERIFICATION STATUS (collapsed)     │
├─────────────────────────────────────┤
│ ACTIONS                             │
│  [Request verification] [View ↗]    │
└─────────────────────────────────────┘
```

**Panel width:** 320px (Greenhouse sidebar standard)  
**Panel height:** Scrollable, max viewport height  
**Theme:** Match Greenhouse light mode; respect GH dark mode if available

---

## Component Specifications

### Header

| Element | Spec |
|---------|------|
| Logo | WorkVouch wordmark, 16px height |
| Sync badge | Green dot + "Synced 2m ago" / Amber "Stale" / Red "Error" |
| External link | Opens full WorkVouch profile in new tab |

---

### Status Card

```
┌─────────────────────────────────────┐
│  ● Verified Candidate               │
│  Linked · Auto-matched by email     │
└─────────────────────────────────────┘
```

| Status | Badge color | Copy |
|--------|--------------|------|
| Verified | Green | "Verified Candidate" |
| Partially verified | Amber | "Verification in progress" |
| Not verified | Gray | "Not yet verified" |
| Not linked | Gray outline | "Not linked to WorkVouch" |

---

### Trust Score (Hero)

```
        ┌──────────┐
        │    78    │  ← 48px bold, tabular nums
        │  / 100   │  ← 14px muted
        └──────────┘
        Strong      ← band label, WvBadge success variant
        ↑ +6 this month  ← optional trend
```

**Color by band:**
| Band | Color |
|------|-------|
| Low (0–39) | Red |
| Moderate (40–59) | Amber |
| Strong (60–79) | Blue |
| Exceptional (80–100) | Green |

**Tooltip on hover:** "Trust scores reflect verified employment and coworker vouches. [Learn more ↗]"

---

### Quick Indicators

Three pill indicators in a row:

```
[ ✓ Employment ]  [ ✓ 5 Vouches ]  [ ○ Verification ]
   verified         count            pending
```

---

### AI Summary (Expandable)

**Collapsed (default):**
```
▶ AI Summary · 3 sentences
```

**Expanded:**
```
▼ AI Summary
─────────────────────────────────────
Jane has 4 years of verified experience
at Acme Corp as Senior Engineer. Strong
vouch from direct manager with 4.8/5
rating. No employment disputes. Would
rehire: Yes.

Generated 2 minutes ago · [Refresh]
```

**Loading:**
```
▶ AI Summary · Generating...
```

**Error:**
```
▶ AI Summary · Unavailable [Retry]
```

See [07-ai-experience.md](./07-ai-experience.md)

---

### Employment Timeline (Expandable)

```
▼ Employment Timeline
─────────────────────────────────────
● Acme Corp · Senior Engineer
  Jan 2020 – Present
  ✓ Verified by manager

● Beta Inc · Engineer  
  Jun 2017 – Dec 2019
  ✓ Coworker vouch

○ StartupXYZ · Intern
  May 2016 – Aug 2016
  Self-reported only
```

**Visual:** Vertical timeline with dots. Green = verified, gray = unverified.

---

### Reference Summary (Expandable)

```
▼ Vouch Summary
─────────────────────────────────────
5 coworker vouches · Avg 4.6/5
Manager vouch: ✓ Yes
Consensus: Strong agreement
Would rehire: Yes (manager stated)

Individual vouch text is not shown
to protect privacy.
```

---

### Verification Status (Expandable)

```
▼ Verification Status
─────────────────────────────────────
Employment at Acme Corp
● Verified · Mar 15, 2026
Verified by: HR contact

Pending: Beta Inc employment
Requested 3 days ago
[Send reminder]
```

---

### Action Buttons

| Button | When shown | Action |
|--------|-----------|--------|
| Request verification | Not fully verified | Opens inline modal |
| Link candidate | Not linked | Inline link flow |
| Invite to WorkVouch | No profile | Sends invite email |
| View full profile ↗ | Always (if linked) | New tab |
| Send reminder | Pending verification | Email to candidate |

**Button hierarchy:** Primary = most needed action. Secondary = View profile.

---

## Loading States

| Component | Loading UI |
|-----------|-----------|
| Full panel | Skeleton shimmer, 3 rows |
| Trust score | Circular skeleton |
| AI summary | "Generating summary..." with pulse |
| Timeline | 2 row skeletons |
| Action button | Spinner + disabled |

---

## Error States

| Error | Panel shows |
|-------|-------------|
| Not linked | Status card + Link/Invite CTAs |
| API timeout | Cached data + "Showing cached · Retry" |
| No permission | "Upgrade to view trust scores" (employer plan) |
| Candidate deleted externally | "Candidate removed from Greenhouse" |

---

## Greenhouse Custom Fields (Parallel Export)

In addition to panel, trust data exported to GH native custom fields:

| GH Custom Field | Value |
|-----------------|-------|
| WorkVouch Trust Score | 78 |
| WorkVouch Trust Band | Strong |
| WorkVouch Profile URL | https://workvouch.com/v/jane-smith |
| WorkVouch Last Synced | 2026-08-07T20:00:00Z |
| WorkVouch Verification | Verified |

Recruiters using GH list views see trust score without opening panel.

---

## Wireframe: Panel in Greenhouse Context

```
┌────────────────────────────────────────────────────────────┐
│ GREENHOUSE                                    │ WORKVOUCH  │
│ ───────────────────────────────────────────── │ ────────── │
│ Candidates > Jane Smith > Application         │ [Panel]    │
│                                               │            │
│ Name: Jane Smith                              │ Trust: 78  │
│ Email: jane@example.com                       │ Strong     │
│ Phone: ...                                    │            │
│                                               │ AI Summary │
│ Application for: Senior Engineer              │ Timeline   │
│ Stage: ● Phone Screen                         │ Actions    │
│                                               │            │
│ [Notes] [Emails] [Scorecard]                  │            │
└────────────────────────────────────────────────────────────┘
```

---

## Related Documents

- [02-recruiter-experience.md](./02-recruiter-experience.md)
- [07-ai-experience.md](./07-ai-experience.md)
- [09-status-system.md](./09-status-system.md)
