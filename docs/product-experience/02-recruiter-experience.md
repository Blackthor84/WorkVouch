# 02 — Recruiter Experience

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## Design North Star

> The recruiter opens a candidate in Greenhouse and knows within 60 seconds whether this person is worth a phone screen — without leaving Greenhouse.

---

## Entry Point: Recruiter Opens Candidate

**Context:** Recruiter is in Greenhouse, viewing candidate "Jane Smith" for Senior Engineer role.

**Trigger:** Greenhouse sidebar extension loads WorkVouch panel automatically.

---

## Click-by-Click Flow

### State 0: Panel Loading (0–800ms)

```
┌─────────────────────────────────────┐
│  WorkVouch                    [↗]   │
├─────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│         Loading trust data...       │
└─────────────────────────────────────┘
```

**Message:** "Loading trust data..."  
**Duration target:** <800ms (cached) / <2s (fresh API call)  
**If >3s:** "Taking longer than usual — showing cached data"

---

### State 1: Linked + Verified (Happy Path)

```
┌─────────────────────────────────────┐
│  WorkVouch              ● Synced 2m [↗]│
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  TRUST SCORE                 │   │
│  │  ┌────┐                       │   │
│  │  │ 78 │  Strong               │   │
│  │  └────┘  / 100                │   │
│  │  Verified by 2 employers      │   │
│  │  5 coworker vouches             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ● Verified  ○ Employment  ● Vouches │
│                                     │
│  ▼ AI Summary                       │
│  "Jane has 4 years verified at      │
│   Acme Corp as Senior Engineer.     │
│   Strong vouch from direct manager. │
│   No disputes. Would rehire: Yes."  │
│                                     │
│  ▼ Employment Timeline              │
│  ▼ Reference Summary                │
│                                     │
│  [Request verification]  [View profile ↗]│
└─────────────────────────────────────┘
```

**Click 1:** Recruiter sees panel — no action needed.  
**System:** Trust score, band, vouch count loaded from last sync.

**Click 2 (optional):** Expands "Employment Timeline"  
**System:** Shows verified roles with dates, verification badges.

**Click 3 (optional):** Expands "Reference Summary"  
**System:** Vouch count, average rating, consensus indicator (no vouch text).

**Click 4 (optional):** Clicks "View profile ↗"  
**System:** Opens WorkVouch public profile in new tab.

**Success message:** None needed — recruiter has decision data.  
**Recruiter action:** Moves candidate to phone screen in Greenhouse.

---

### State 2: Linked + Pending Verification

```
┌─────────────────────────────────────┐
│  WorkVouch              ● Synced 5m │
├─────────────────────────────────────┤
│  TRUST SCORE: 42  Moderate          │
│  ⚠ Verification in progress         │
│  Requested 2 days ago                 │
│                                     │
│  [Send reminder to candidate]       │
└─────────────────────────────────────┘
```

**Message:** "Verification in progress — requested 2 days ago"  
**Action:** "Send reminder" → triggers candidate reminder email  
**Success:** "Reminder sent to jane@example.com"

---

### State 3: Not Linked

```
┌─────────────────────────────────────┐
│  WorkVouch                            │
├─────────────────────────────────────┤
│  ○ Not linked to WorkVouch           │
│                                     │
│  jane@example.com                   │
│  [Link to WorkVouch profile]        │
│  [Invite to get verified]           │
└─────────────────────────────────────┘
```

**Click 1:** "Link to WorkVouch profile"  
**System:** Searches by email → shows match or "No profile found"

**If match found:**
```
✓ Found: Jane Smith (jane@example.com)
  Trust score: 78 · 5 vouches
  [Confirm link]
```
**Click 2:** Confirm → Panel refreshes to State 1

**If no match:**
```
No WorkVouch profile found for this email.
[Invite Jane to get verified]
```
**Click:** Invite → email sent → status "Invitation sent"

---

### State 4: Stale Data (OAuth/Token Issue)

```
┌─────────────────────────────────────┐
│  WorkVouch              ⚠ Stale 2d  │
├─────────────────────────────────────┤
│  TRUST SCORE: 78  Strong  (cached)  │
│  ⚠ Connection needs attention         │
│  Ask your admin to reconnect          │
│  [View cached profile ↗]              │
└─────────────────────────────────────┘
```

**Message:** Data shown is cached. Admin notified automatically.

---

### State 5: Error

```
┌─────────────────────────────────────┐
│  WorkVouch                            │
├─────────────────────────────────────┤
│  ⚠ Unable to load trust data          │
│  WorkVouch may be temporarily         │
│  unavailable.                         │
│  [Retry]  [View profile manually ↗]   │
└─────────────────────────────────────┘
```

**Click Retry:** Re-fetches. Max 3 retries with backoff message.

---

## Expandable Panels Detail

### Employment Timeline (Expanded)

```
▼ Employment Timeline
─────────────────────────────────────
  Acme Corp · Senior Engineer
  Jan 2020 – Present  ✓ Verified
  Verified by: Direct manager

  Beta Inc · Engineer
  Jun 2017 – Dec 2019  ✓ Verified
  Verified by: Coworker vouch

  ─── Unverified ───
  StartupXYZ · Intern
  May 2016 – Aug 2016  ○ Self-reported
```

### Reference Summary (Expanded)

```
▼ Reference Summary
─────────────────────────────────────
  5 coworker vouches  ·  Avg 4.6/5
  Manager vouch: Yes
  Consensus: Strong agreement
  ⚠ No vouch text shown (privacy)
```

---

## Recruiter Actions Matrix

| Action | Location | Clicks | Result |
|--------|----------|--------|--------|
| Evaluate candidate | Panel (default) | 0 | Trust score visible |
| Expand timeline | Panel | 1 | Employment history |
| Expand vouches | Panel | 1 | Vouch summary |
| Link candidate | Panel | 2 | Profile linked |
| Invite candidate | Panel | 2 | Email sent |
| Request verification | Panel | 2 | Verification started |
| Send reminder | Panel | 1 | Reminder sent |
| View full profile | Panel | 1 | New tab |
| Move to next stage | Greenhouse | — | Trust exported in background |

---

## Loading States Summary

| State | Visual | Message | Max wait |
|-------|--------|---------|----------|
| Initial load | Skeleton shimmer | "Loading trust data..." | 3s → cached fallback |
| Link search | Spinner inline | "Searching WorkVouch..." | 5s |
| Export trigger | Checkmark animation | "Trust score updated in Greenhouse" | 2s toast |
| Invite send | Button loading | "Sending invitation..." | 3s |

---

## Error Messages (Recruiter-Facing)

| Error | Message | Recovery |
|-------|---------|----------|
| Not linked | "Not linked to WorkVouch" | Link or Invite buttons |
| No profile | "No WorkVouch profile found" | Invite button |
| Sync failed | "Last sync failed — showing cached data" | Auto-retry + admin alert |
| API down | "Unable to load trust data" | Retry button |
| Permission | "Your plan doesn't include trust scores" | Upgrade CTA (employer admin) |

---

## Wireframe: Full Panel (Desktop — Greenhouse Sidebar)

```
┌──────────────────────────────────────────────────┐
│ GREENHOUSE CANDIDATE VIEW          │ WORKVOUCH    │
│                                    │ PANEL        │
│  Jane Smith                        │ ┌──────────┐ │
│  Senior Engineer                   │ │ Trust 78 │ │
│  jane@example.com                  │ │ Strong   │ │
│                                    │ └──────────┘ │
│  [Application] [Scorecard]         │              │
│  [Notes] [Activity]                │ AI Summary   │
│                                    │ Timeline ▼   │
│  Stage: Phone Screen               │ Vouches ▼    │
│                                    │              │
│                                    │ [Actions]    │
└──────────────────────────────────────────────────┘
     70% width                            30% width
```

---

## Related Documents

- [06-workvouch-panel.md](./06-workvouch-panel.md)
- [07-ai-experience.md](./07-ai-experience.md)
- [09-status-system.md](./09-status-system.md)
