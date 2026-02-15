# Sandbox ≠ Production — Safety Checklist & Demo Script

## 🛑 PART 2 — SANDBOX ≠ PRODUCTION SAFETY CHECKLIST

**Run this before every deploy.**

### Environment
- [ ] `NEXT_PUBLIC_APP_MODE=sandbox` (or equivalent) only in sandbox env
- [ ] Production has no `/sandbox/*` routes exposed to non-admins (layout enforces admin)
- [ ] Sandbox APIs return 403 when not in sandbox mode (`requireSandboxMode()`)

### Database
- [ ] Every sandbox write sets `is_sandbox = true` (audit logs and sandbox_* tables only)
- [ ] Queries default to production data; sandbox uses `sandbox_*` tables only
- [ ] No cross-joins between sandbox and production user/employer data

### Auth
- [ ] Impersonation only allowed if: Admin role **and** Sandbox env
- [ ] Impersonation banner visible at all times when active (global banner)

### UI
- [ ] Playground hidden in prod (page renders "not available" when `!isSandbox()`)
- [ ] Observer read-only; no write actions from Observer
- [ ] No scores/labels shown to real users (internal names only in Observer)

**If all checked → safe to ship.**

---

## 🎬 PART 3 — 1-MINUTE INVESTOR / APP-STORE DEMO

Scripted. Practice once.

| Time | Action |
|------|--------|
| **0:00–0:10** | **Setup** — "This is WorkVouch's sandbox. Everything here is isolated." Click: **Sandbox → Playground** |
| **0:10–0:25** | **Spawn Reality** — Click: **Spawn Employer + Team**. "These are simulated workers and an employer." |
| **0:25–0:40** | **Trust in Motion** — Click: **Impersonate** (Worker) → **Leave Vouch** → **Submit Culture Traits**. Point at: Trust delta, Culture aggregation. "Trust and culture update in real time." |
| **0:40–0:55** | **Abuse Handling** — Click: **Flag Dispute**. Show: Abuse risk rising. "We detect risk without punishing users." (No labels, no bans.) |
| **0:55–1:00** | **Close** — "That's WorkVouch — real reputation, safely simulated." Stop. |

---

## API Summary

- `GET /api/sandbox/list` — list sandbox users (workers + employers) for impersonation
- `GET /api/sandbox/observer` — read-only trustDelta, culture, signals, abuseRisk
- `POST /api/sandbox/spawn` — body `{ type: "worker"|"employer"|"pair"|"team", sandboxId? }`
- `POST /api/sandbox/impersonate` — body `{ targetUserId, targetName?, sandboxId? }`
- `POST /api/sandbox/impersonate/exit` — clear impersonation
- `POST /api/sandbox/trigger/leave-vouch` — body `{ sandboxId, workerId, coworkerId }`
- `POST /api/sandbox/trigger/[action]` — complete-profile, submit-culture, flag-dispute, confirm-coworker, flag-fraud (stub ok)
