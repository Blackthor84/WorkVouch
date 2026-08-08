# 10 — Settings and Automation

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## Settings Location

**Route:** `/employer/settings/integrations/greenhouse`

Accessible from:
- Employer Settings → Integrations → Greenhouse
- Integration dashboard → "Configure"
- Post-connect onboarding wizard

---

## Settings Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Greenhouse Integration                          [Connected ✓] │
├─────────────────────────────────────────────────────────────┤
│  CONNECTION                                                 │
│  Connected as: Acme Corp · Greenhouse Board Token           │
│  Last sync: 2 minutes ago · 847 candidates linked           │
│  [Reconnect]  [Disconnect]                                  │
├─────────────────────────────────────────────────────────────┤
│  AUTOMATION                                                 │
│  ▼ Candidate invitations                                    │
│  ▼ Trust score export                                       │
│  ▼ Reference reminders                                      │
│  ▼ AI features                                              │
├─────────────────────────────────────────────────────────────┤
│  FILTERS                                                    │
│  ▼ Job filters                                              │
│  ▼ Location filters                                         │
├─────────────────────────────────────────────────────────────┤
│  NOTIFICATIONS                                              │
│  ▼ Email preferences                                        │
├─────────────────────────────────────────────────────────────┤
│  ADVANCED                                                   │
│  ▼ Expiration rules                                         │
│  ▼ Trust score threshold                                    │
│  ▼ Custom field mapping                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Candidate Invitations

### Auto-Invite Toggle

```
☑ Automatically invite candidates to WorkVouch
```

**When disabled:** Recruiters manually invite from GH panel. No auto-emails.

### Invite Trigger (Pipeline Stage)

| Option | Description | Default |
|--------|-------------|---------|
| **Immediately on application** | Invite when candidate applies | Off |
| **After phone screen** | When moved to Phone Screen stage | Off |
| **After final interview** | When moved to Final Interview | ✅ Recommended |
| **After offer extended** | When offer is sent | Off |
| **Manual only** | Never auto-invite | Off |

**UI:** Radio group with stage selector dropdown (populated from GH pipeline stages via API).

### Invite Delay

```
Send invitation [0 ▼] hours after stage change
```
Options: 0, 1, 4, 24 hours. Default: 0.

**Rationale:** Delay prevents invite during rapid stage changes.

---

## 2. Trust Score Export

### Auto-Export Toggle

```
☑ Automatically export trust scores to Greenhouse
```

### Export Trigger

| Option | Description | Default |
|--------|-------------|---------|
| **On score change** | Export whenever trust score updates | ✅ |
| **On verification complete** | Export when candidate becomes Verified | ✅ |
| **Daily batch** | Export all linked candidates once daily | Off |
| **Manual only** | Recruiter clicks "Export" in panel | Off |

### Export Fields (Checkboxes)

```
☑ Trust score (numeric)
☑ Trust band (Low / Moderate / Strong / Exceptional)
☑ Verification status
☐ Vouch count (aggregate only)
☐ Employment count (aggregate only)
```

**Never export:** Vouch text, reference names, location details.

---

## 3. Reference Reminders

```
Reminder frequency for pending vouches:
  First reminder:  [3 days ▼] after request
  Second reminder: [7 days ▼] after request
  Final reminder:  [14 days ▼] after request
  Stop after:      [3 ▼] reminders
```

**Defaults:** 3 / 7 / 14 days, stop after 3.

### Verification Reminders

```
Reminder frequency for pending employment verification:
  First reminder:  [2 days ▼]
  Second reminder: [5 days ▼]
  Stop after:      [2 ▼] reminders
```

---

## 4. AI Features

```
☑ Enable AI candidate summaries in Greenhouse panel
☑ Enable AI risk detection alerts
☐ Enable predictive hiring insights (beta)
```

**When AI disabled:** Panel shows structured data only (trust score, timeline, vouch count). No AI summary section.

---

## 5. Job Filters

```
Only auto-invite candidates for these jobs:
  ○ All jobs
  ● Selected jobs only
    ☑ Senior Software Engineer (Req #1234)
    ☑ Product Manager (Req #1235)
    ☐ Marketing Coordinator (Req #1236)
    [+ Add job from Greenhouse]
```

**Job picker:** Searchable dropdown synced from GH jobs API.

---

## 6. Location Filters

```
Only auto-invite candidates in these locations:
  ○ All locations
  ● Selected locations only
    ☑ United States (all states)
    ☑ Canada
    ☐ Remote (any country)
```

**Privacy note:** Location filters use country/state only (WorkVouch location policy). No city/ZIP filtering.

---

## 7. Expiration Rules

```
Invitation expires after:     [30 days ▼]
Verification link expires:  [14 days ▼]
Vouch request expires:      [21 days ▼]
```

**On expiry:** Status → Expired. Recruiter can re-invite from panel (one click).

---

## 8. Trust Score Threshold

```
Only export trust scores ≥ [0 ▼] to Greenhouse
```

**Use case:** Employer only wants to see candidates who've built meaningful profiles.

| Threshold | Effect |
|-----------|--------|
| 0 (default) | Export all linked candidates |
| 40 | Only Moderate+ candidates |
| 60 | Only Strong+ candidates |
| 80 | Only Exceptional candidates |

**Below threshold:** GH custom field shows "Profile building" instead of score.

---

## 9. Custom Field Mapping

```
Greenhouse custom fields:
  Trust Score    → [custom_field_12345 ▼]
  Trust Band     → [custom_field_12346 ▼]
  Verification   → [custom_field_12347 ▼]
```

**Auto-detect:** On first connect, WorkVouch creates recommended custom fields in GH (with employer approval).

---

## 10. Notification Preferences

```
☑ Email when connection issues occur
☑ Email weekly integration summary
☐ Email for every candidate auto-linked
☑ In-app notifications for sync events
```

---

## Automation Presets

Quick-start templates for common configurations:

| Preset | Invite trigger | Export | AI | Use case |
|--------|---------------|--------|-----|----------|
| **Conservative** | Manual only | On verification | Off | Pilot / testing |
| **Standard** | Final interview | On score change | On | Most employers |
| **Aggressive** | Phone screen | On score change + daily | On | High-volume hiring |
| **Post-offer** | After offer | On verification | On | Compliance-focused |

**UI:** Preset cards at top of automation section. Selecting preset fills all fields. Employer can customize after.

---

## Settings Change Behavior

| Change | Effect |
|--------|--------|
| Disable auto-invite | No new invites; existing in-flight invites continue |
| Change invite trigger | Applies to future stage changes only |
| Change job filter | Applies to future candidates only |
| Change export threshold | Re-evaluates all linked candidates on next sync |
| Disconnect | Stops all automation immediately; data preserved |

---

## Audit Log

Every settings change logged:

```
Mar 15, 2026 · Admin User · Changed invite trigger: Phone Screen → Final Interview
Mar 14, 2026 · Admin User · Enabled AI summaries
Mar 10, 2026 · System · Initial connection established
```

---

## Related Documents

- [03-employer-experience.md](./03-employer-experience.md)
- [08-notification-system.md](./08-notification-system.md)
- [09-status-system.md](./09-status-system.md)
