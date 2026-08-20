# Demo Script (Greenhouse Review)

**Duration:** 10–15 minutes

## Setup

Enable demo mode in reviewer environment:

```bash
CONNECT_DEMO_MODE_ENABLED=true
```

Or use staging with demo URLs below.

## Script

### 1. Value Proposition (2 min)

"WorkVouch brings verified employment and hiring confidence into Greenhouse so recruiters never leave the ATS to assess candidate trust."

### 2. Employer Connect (3 min)

1. Open **Employer → Integrations**
2. Show provider cards and health summary
3. Walk through Connect Greenhouse (OAuth) — or show connected state
4. Open **Health Dashboard** — all components green

### 3. Embedded Panel — High Confidence (3 min)

Open: `/integrations/greenhouse/panel?demo=1&scenario=high`

Highlight:
- **Hiring Confidence** hero (score + level)
- Trust score supporting card
- Verified employment timeline
- Reference consensus

### 4. Warning Scenario (2 min)

Open: `/integrations/greenhouse/panel?demo=1&scenario=warning`

Highlight:
- Lower confidence with clear explanation
- What recruiter should do next

### 5. Not Linked (1 min)

Open: `/integrations/greenhouse/panel?demo=1&scenario=not_linked`

Show invite/automation CTA.

### 6. Operations (2 min)

1. **Event Explorer** — show webhook event stream
2. **Replay Center** — demonstrate retry UX
3. **Diagnostic Bundle** — one-click support export

### 7. Q&A

Reference [faq.md](./faq.md) and [limitations.md](./limitations.md).

## Demo Reset

```bash
node scripts/connect-demo-reset.mjs
```

Prints all scenario URLs for copy/paste.

## Screenshots Checklist

- [ ] Integrations dashboard
- [ ] Health dashboard
- [ ] Panel high confidence
- [ ] Panel warning state
- [ ] Event explorer
