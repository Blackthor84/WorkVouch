# 05 — Reference Provider Experience

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## Personas

| Persona | Context | Time budget |
|---------|---------|-------------|
| **Direct manager** | Former boss, employment verification + vouch | 5 minutes |
| **Coworker** | Peer vouch request | 3 minutes |
| **HR contact** | Employment verification only | 2 minutes |

---

## Journey: Manager Vouch + Verification

### 1. Invitation Email

**Subject:** `Alex Johnson requested your vouch on WorkVouch`

```
Hi Sarah,

Alex Johnson listed you as their manager at Acme Corp (2020–2023).
They're building a verified professional profile for their job search.

Alex is asking you to:
• Confirm their employment dates (30 seconds)
• Leave a brief vouch (2 minutes)

[Respond to Alex's request →]

This link expires in 14 days.
You don't need a WorkVouch account to respond.
```

---

### 2. Landing Page (No Login Required)

**Route:** `/vouch/{token}`

```
┌─────────────────────────────────────────────────────────────┐
│  [WorkVouch]                                                │
│                                                             │
│  Alex Johnson requested your vouch                          │
│                                                             │
│  You worked together at Acme Corp                           │
│  Alex's role: Senior Engineer                               │
│  Your relationship: Direct manager                          │
│  Dates claimed: Jan 2020 – Mar 2023                         │
│                                                             │
│  [Confirm & leave vouch →]                                  │
│  [I'm not the right person]                                 │
└─────────────────────────────────────────────────────────────┘
```

**"I'm not the right person":** Declines gracefully. Alex notified. No penalty.

---

### 3. Employment Confirmation

```
┌─────────────────────────────────────────────────────────────┐
│  Confirm Alex's employment at Acme Corp                       │
│                                                             │
│  Did Alex work at Acme Corp as Senior Engineer?              │
│  Jan 2020 – Mar 2023                                        │
│                                                             │
│  [Yes, that's correct]  [Dates are wrong]  [No, they didn't]│
└─────────────────────────────────────────────────────────────┘
```

**"Dates are wrong":** Optional correction fields. Flagged for review, not auto-rejected.

---

### 4. Vouch Questions

```
┌─────────────────────────────────────────────────────────────┐
│  Leave a vouch for Alex                                     │
│                                                             │
│  Overall rating                                             │
│  ☆ ☆ ☆ ☆ ☆  (tap to rate 1–5)                              │
│                                                             │
│  Would you work with Alex again?                            │
│  [Yes]  [Maybe]  [No]                                       │
│                                                             │
│  Optional comment (not shown to all employers)              │
│  [________________________________________________]         │
│                                                             │
│  [Submit vouch]                                             │
└─────────────────────────────────────────────────────────────┘
```

**Privacy note below form:** "Your comment is used for trust scoring only. Individual vouch text is not shared with employers."

---

### 5. Confirmation Screen

```
┌─────────────────────────────────────────────────────────────┐
│                    ✓ Thank you, Sarah!                        │
│                                                             │
│  Your vouch helps Alex build a verified professional        │
│  profile. Employers see that a real manager confirmed       │
│  their work history.                                        │
│                                                             │
│  [Create your own WorkVouch profile →]  (optional upsell)     │
│  [Done]                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Journey: Coworker Vouch (Simpler)

Skips employment confirmation if overlap already verified.

```
Landing → Rate 1-5 → Optional comment → Submit → Thank you
Target: 3 minutes, 3 screens
```

---

## Reminder Flow

| Timing | Subject |
|--------|---------|
| 3 days | `Reminder: Alex requested your vouch` |
| 7 days | `Last reminder: Alex's vouch request` |
| 14 days | Link expires — Alex notified to request new link |

**Reference provider receives max 2 reminders.** Never spam.

---

## Mobile Experience

- Single column layout
- Star rating: large touch targets (44px)
- Submit button: sticky bottom on mobile
- No horizontal scroll
- Works without app install

---

## Error States

| State | Message | Recovery |
|-------|---------|----------|
| Expired link | "This link expired on {date}" | "Request a new link" → notifies Alex |
| Already submitted | "You already vouched for Alex" | Show confirmation summary |
| Invalid token | "This link is invalid" | Contact support link |
| Wrong person | "Thanks — we'll let Alex know" | Graceful decline |

---

## Related Documents

- [04-candidate-experience.md](./04-candidate-experience.md)
- [11-mobile-experience.md](./11-mobile-experience.md)
- [12-error-handling.md](./12-error-handling.md)
