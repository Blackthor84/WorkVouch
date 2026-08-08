# 08 — Notification System

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## Notification Channels

| Channel | Used for | Priority |
|---------|----------|----------|
| **Email** | Invites, reminders, token expiry, milestones | High |
| **In-app** | Sync events, link status, score changes | Medium |
| **Greenhouse panel** | Real-time status (passive) | Passive |
| **Admin alerts** | DLQ, connection failures | Ops |

**No SMS for integration events** (existing Twilio used for verification reminders only).

---

## Employer / Admin Notifications

### In-App (`employer_notifications`)

| Type | Trigger | Message | Action link |
|------|---------|---------|-------------|
| `integration_connected` | OAuth success | "Greenhouse connected successfully" | Integration dashboard |
| `integration_token_expired` | Token refresh failed | "Greenhouse session expired — reconnect to resume sync" | Reconnect flow |
| `integration_sync_error` | 3+ failures in 1h | "Trust export failed for {n} candidates" | Health dashboard |
| `integration_candidate_pending_link` | Auto-link failed | "New Greenhouse candidate needs manual linking" | Candidates tab |
| `integration_candidate_auto_linked` | Email match | "{name} linked to Greenhouse automatically" | Candidate profile |
| `integration_trust_pushed` | Export success (batch) | "Trust scores updated for {n} candidates in Greenhouse" | Sync log |
| `integration_initial_sync_complete` | First sync done | "Initial sync complete — {n} candidates linked" | Dashboard |

### Email (Employer Admin)

| Email | Trigger | Timing | Subject |
|-------|---------|--------|---------|
| Connected | OAuth success | Immediate | "Greenhouse connected to WorkVouch" |
| Token expired | Refresh failed | Immediate | "Action required: Reconnect Greenhouse" |
| Weekly digest | Cron | Monday 9am | "WorkVouch integration summary — {n} syncs this week" |
| Sync failure | 3+ DLQ items | Immediate | "WorkVouch sync needs attention" |

---

## Recruiter Notifications

Recruiters do **not** receive emails for integration events. All recruiter info is in the Greenhouse panel (passive, always current).

**Exception:** If recruiter triggers "Send reminder" → candidate receives email (not recruiter).

---

## Candidate Notifications

### Email

| Email | Trigger | Timing |
|-------|---------|--------|
| Invitation | Employer/recruiter invite | Immediate |
| Reminder 1 | No account after invite | +24 hours |
| Reminder 2 | Still no account | +72 hours |
| Reminder 3 (final) | Still no account | +7 days |
| Vouch received | Reference submits vouch | Immediate |
| Employment verified | Verification confirmed | Immediate |
| Trust score milestone | Crosses band threshold | Immediate |
| Verification reminder | Pending verification | +48 hours |

### In-App

| Type | Message |
|------|---------|
| Vouch received | "Sarah vouched for you! Your trust score increased." |
| Employment verified | "Your employment at Acme Corp was verified." |
| Score increased | "Your trust score is now Strong (78)." |
| Synced to employer | "Acme Corp can now see your verified profile." |

---

## Reference Provider Notifications

| Email | Trigger | Timing |
|-------|---------|--------|
| Vouch request | Candidate sends request | Immediate |
| Reminder 1 | No response | +3 days |
| Reminder 2 (final) | No response | +7 days |

**No in-app** — reference providers may not have accounts.

---

## Reminder Timing Rules

```
Global rules:
- Max 3 reminders per flow
- Minimum 24h between reminders
- Stop immediately on completion
- Stop on explicit decline ("I'm not the right person")
- No reminders on weekends (send Monday if due Sat/Sun)
- Respect unsubscribe for non-transactional emails
```

---

## Success Notifications

| Actor | Event | Celebration |
|-------|-------|-------------|
| Candidate | First vouch | In-app + email with score increase |
| Candidate | Profile complete | Badge + email |
| Employer | Initial sync complete | In-app + modal on dashboard |
| Employer | 100th trust export | In-app milestone (future) |
| Reference | Vouch submitted | Thank you screen (immediate) |

---

## Failure Notifications

| Actor | Failure | Channel | Urgency |
|-------|---------|---------|---------|
| Employer admin | Token expired | Email + in-app | High — same day |
| Employer admin | DLQ > 5 | Email + in-app | Medium — within 1h |
| Employer admin | Webhook rejected | Admin alert only | Low — ops |
| Candidate | Invite bounce | In-app to recruiter | Medium |
| Recruiter | Panel load fail | Panel error state | Passive — no email |

---

## Notification Preferences (Employer Settings)

```
Integration notifications
☑ Email me when connection issues occur
☑ Email me weekly integration summary
☐ Email me for every candidate auto-linked (verbose)
☑ In-app notifications for sync events
```

---

## Related Documents

- [04-candidate-experience.md](./04-candidate-experience.md)
- [05-reference-provider-experience.md](./05-reference-provider-experience.md)
- [12-error-handling.md](./12-error-handling.md)
