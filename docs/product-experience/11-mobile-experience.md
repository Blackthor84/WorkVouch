# 11 — Mobile Experience

> **Sprint:** Operation Greenhouse — Sprint 2.5 (Product Design)  
> **Last updated:** 2026-08-07

---

## Mobile Strategy

| Persona | Primary device | Mobile priority |
|---------|---------------|-----------------|
| **Recruiter** | Desktop (Greenhouse) | Low — panel is desktop-only |
| **Employer Admin** | Desktop | Medium — responsive settings |
| **Candidate** | Mobile (60%+) | **High — primary design target** |
| **Reference Provider** | Mobile (70%+) | **High — primary design target** |

**Principle 13:** Mobile-first for candidates and references. Desktop-first for recruiters and employers.

---

## Candidate Mobile Experience

### Invitation Email → Mobile Landing

```
┌─────────────────────────┐
│  WorkVouch              │
│                         │
│  Acme Corp invited you  │
│  to build your verified │
│  work profile.          │
│                         │
│  ┌───────────────────┐  │
│  │  Get Started      │  │
│  └───────────────────┘  │
│                         │
│  Takes ~10 minutes      │
│  Free · Private · Yours │
└─────────────────────────┘
```

**Design:**
- Full-width CTA button (min 48px touch target)
- No horizontal scroll
- Logo + headline above fold
- Trust indicators below CTA

### Account Creation (Mobile)

```
Step 1 of 4 · Account
┌─────────────────────────┐
│  Create your account    │
│                         │
│  Email                  │
│  ┌───────────────────┐  │
│  │ jane@email.com    │  │
│  └───────────────────┘  │
│  (pre-filled, read-only)│
│                         │
│  Password               │
│  ┌───────────────────┐  │
│  │ ••••••••          │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Continue         │  │
│  └───────────────────┘  │
│                         │
│  ● ○ ○ ○  Step 1 of 4  │
└─────────────────────────┘
```

**Mobile patterns:**
- Single column layout
- Progress dots at bottom (sticky)
- Large input fields (16px font to prevent iOS zoom)
- Sticky CTA button at bottom on long forms

### Work History (Mobile)

```
Step 2 of 4 · Work History
┌─────────────────────────┐
│  Add your work history  │
│                         │
│  ┌───────────────────┐  │
│  │ Acme Corp         │  │
│  │ Senior Engineer   │  │
│  │ 2020 – Present    │  │
│  │ ✓ Verified        │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ + Add employment  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Continue         │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Add employment modal:** Full-screen sheet on mobile (not dropdown).

### Verification Request (Mobile)

```
Step 3 of 4 · Verification
┌─────────────────────────┐
│  Verify your employment │
│                         │
│  We'll email your       │
│  manager at Acme Corp   │
│  to confirm.            │
│                         │
│  Manager email          │
│  ┌───────────────────┐  │
│  │ manager@acme.com  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Send verification│  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Vouch Requests (Mobile)

```
Step 4 of 4 · Vouches
┌─────────────────────────┐
│  Request vouches        │
│                         │
│  Coworkers who can      │
│  vouch for your work:   │
│                         │
│  ┌───────────────────┐  │
│  │ sarah@acme.com    │  │
│  │ Coworker          │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ + Add coworker    │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Send requests    │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Completion Screen (Mobile)

```
┌─────────────────────────┐
│                         │
│         ✓               │
│                         │
│  Profile complete!      │
│                         │
│  Trust score: 78        │
│  Strong                 │
│                         │
│  ████████████░░  78     │
│                         │
│  Acme Corp can now see  │
│  your verified profile. │
│                         │
│  ┌───────────────────┐  │
│  │  View my profile  │  │
│  └───────────────────┘  │
│                         │
│  Share your profile →   │
└─────────────────────────┘
```

**Celebration:** Confetti animation (subtle, 2s). Haptic feedback on iOS.

---

## Reference Provider Mobile Experience

### Vouch Request Email → Mobile

```
┌─────────────────────────┐
│  WorkVouch              │
│                         │
│  Jane Doe asked you to  │
│  vouch for her work at  │
│  Acme Corp.             │
│                         │
│  ┌───────────────────┐  │
│  │  Vouch for Jane   │  │
│  └───────────────────┘  │
│                         │
│  Takes ~3 minutes       │
│  No account required    │
└─────────────────────────┘
```

### Vouch Form (Mobile — No Account Required)

```
┌─────────────────────────┐
│  Vouch for Jane Doe     │
│  Acme Corp · 2020–2023  │
│                         │
│  Did Jane work with you?│
│  ○ Yes  ○ No            │
│                         │
│  How would you rate     │
│  Jane's work?           │
│  ★ ★ ★ ★ ☆  4/5        │
│                         │
│  Would you work with    │
│  Jane again?            │
│  ○ Yes  ○ Maybe  ○ No   │
│                         │
│  Optional comment       │
│  ┌───────────────────┐  │
│  │ Jane was a great│  │
│  │ team player...  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Submit vouch     │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Key mobile UX:**
- Star rating: large touch targets (44px)
- Radio buttons: full-width tap areas
- Text area: auto-expand
- Submit: sticky bottom button
- No login required — token-based auth

### Confirmation (Mobile)

```
┌─────────────────────────┐
│                         │
│         ✓               │
│                         │
│  Thank you!             │
│                         │
│  Your vouch helps Jane  │
│  build a verified work  │
│  profile.               │
│                         │
│  Jane's trust score     │
│  increased to 78.       │
└─────────────────────────┘
```

---

## Employer Mobile Experience (Responsive)

Employer admin flows are desktop-primary but must work on tablet/mobile for on-the-go monitoring.

### Integration Dashboard (Tablet)

```
┌─────────────────────────────────┐
│  Greenhouse Integration    ✓    │
├─────────────────────────────────┤
│  Connected · Synced 2m ago      │
│  847 candidates · 623 verified  │
├─────────────────────────────────┤
│  Health                         │
│  ● Sync: Healthy                │
│  ● Export: Healthy              │
│  ● Webhooks: Healthy            │
├─────────────────────────────────┤
│  Recent Activity                │
│  · Jane Doe linked (2m ago)     │
│  · Trust exported for 12 (1h)   │
│  · Auto-invited 3 candidates    │
└─────────────────────────────────┘
```

**Mobile adaptations:**
- Stack cards vertically
- Collapse sync log to last 5 entries
- Settings → accordion sections
- OAuth reconnect → full-screen modal

### Settings (Mobile)

- All automation toggles: full-width switches
- Job/location filters: modal pickers (not inline dropdowns)
- Save button: sticky bottom

---

## Recruiter Mobile (Out of Scope)

Greenhouse panel is desktop-only. Recruiters on mobile use Greenhouse mobile app without WorkVouch panel.

**Fallback:** If recruiter opens candidate on mobile GH app, show:
```
WorkVouch trust data available on desktop.
[Open in WorkVouch ↗]
```

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| <640px (mobile) | Single column, full-width CTAs, bottom sticky buttons |
| 640–1024px (tablet) | Single column, wider cards, side padding |
| >1024px (desktop) | Multi-column where appropriate, sidebar layouts |

---

## Mobile Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | <1.5s on 4G |
| Time to Interactive | <3s on 4G |
| Form submission | <2s response |
| Page weight | <500KB initial load |

---

## Mobile Accessibility

- Touch targets: minimum 44×44px
- Font size: minimum 16px (prevents iOS zoom)
- Color contrast: WCAG AA
- Screen reader: all form labels associated
- Reduced motion: respect `prefers-reduced-motion`

---

## Related Documents

- [04-candidate-experience.md](./04-candidate-experience.md)
- [05-reference-provider-experience.md](./05-reference-provider-experience.md)
- [14-product-principles.md](./14-product-principles.md)
