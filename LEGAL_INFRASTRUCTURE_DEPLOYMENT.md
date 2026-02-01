# Legal Infrastructure & Transparency Pages — Deployment

This document covers the legal pages, dispute transparency, admin fraud workflow, and compliance pages added for WorkVouch.

## File structure

```
app/
  (public)/
    legal/
      terms/page.tsx          # Terms of Service (Trust Score, Dispute, Employer, Platform clauses)
      privacy/page.tsx        # Privacy Policy (same clauses + data)
      employer-agreement/page.tsx  # Employer Agreement
    how-disputes-work/page.tsx     # Public "How Disputes Work" + CTA
    compliance/page.tsx            # Investor compliance checklist
  admin/
    fraud-workflow/
      page.tsx               # Admin-only fraud workflow (protected by layout + middleware)
      FraudWorkflowClient.tsx
  api/
    admin/
      fraud-workflow/
        log/route.ts          # POST: log workflow step to audit_logs

components/
  legal-page-layout.tsx       # Reusable layout for legal pages (title, nav, prose)

middleware.ts                 # Protects /admin/* (redirect to sign-in if no session)
```

Existing routes `/terms` and `/privacy` (under `app/(public)/terms` and `app/(public)/privacy`) remain; footer now links to `/legal/terms`, `/legal/privacy`, and the new legal/compliance routes.

## Routes summary

| Route | Access | Description |
|-------|--------|-------------|
| `/legal/terms` | Public | Terms of Service (Trust Score disclaimer, Dispute policy, Employer liability, Platform limitation) |
| `/legal/privacy` | Public | Privacy Policy (same clauses + data handling) |
| `/legal/employer-agreement` | Public | Employer Agreement |
| `/how-disputes-work` | Public | How disputes work: overview, what can be disputed, review process, appeals, CTA to dashboard |
| `/compliance` | Public | Investor compliance checklist (Data Protection, Reputation Fairness, Employer Controls, Legal Safeguards) |
| `/admin/fraud-workflow` | Admin only | Internal fraud investigation workflow: checklist, status (clear/confirmed/escalate), notes, log to audit_logs |

## Middleware

- **File:** `middleware.ts` (project root).
- **Behavior:** For paths matching `/admin/:path*`, checks NextAuth JWT via `getToken`. If no session, redirects to `/auth/signin?callbackUrl=<path>`.
- **Role check:** Admin/superadmin is enforced in `app/admin/layout.tsx` (getServerSession + role check). Middleware only ensures the user is signed in before entering `/admin/*`.

## Legal pages content (required clauses)

All three legal pages include:

1. **Trust Score Disclaimer** — Proprietary; informational only; not endorsement or certification; employers responsible for decisions.
2. **Dispute Policy** — Users may dispute employment, references, fraud flags, trust score, rehire eligibility; evidence allowed; admin review; one appeal; abuse may result in suspension.
3. **Employer Liability Clause** — Employers responsible for hiring decisions; rehire data is employer-submitted; WorkVouch does not guarantee accuracy of employer input.
4. **Platform Limitation Clause** — WorkVouch is not a background check service, not a consumer reporting agency (FCRA), not governed as a credit bureau.

## Admin fraud workflow

- **Page:** `/admin/fraud-workflow`. Visible only to users with admin or superadmin role (layout redirects others to `/dashboard`).
- **Checklist:** Review IP logs, check employment overlap, check circular references, review employer complaints.
- **Status:** Clear | Confirmed | Escalate.
- **Internal notes:** Free-text field; stored in `audit_logs.new_value` with status and checklist.
- **API:** `POST /api/admin/fraud-workflow/log` — body: `{ status, notes?, checklist?, fraudFlagId? }`. Inserts into `audit_logs` with `entity_type: "fraud_investigation"`. Service role used; no RLS policy needed for insert.

## Database

- **No new migrations required.** The `audit_logs` table already exists (`entity_type` is `TEXT`), so `entity_type = 'fraud_investigation'` is valid.
- If you use a stricter enum for `entity_type`, add `fraud_investigation` to it; otherwise no change.

## Navigation

- **Footer** (`components/Footer.tsx`): Legal section updated to link to:
  - Terms → `/legal/terms`
  - Privacy → `/legal/privacy`
  - Employer Agreement → `/legal/employer-agreement`
  - How Disputes Work → `/how-disputes-work`
  - Compliance → `/compliance`
  - Trust & Compliance → `/security` (unchanged)

## SEO & metadata

- Each new page has `metadata` (title, description) for SEO.
- Legal and public transparency pages are accessible without login.

## Deployment steps

1. **Deploy code** — All new files are standard Next.js App Router; no build changes.
2. **Environment** — No new env vars. Middleware uses existing `NEXTAUTH_SECRET`.
3. **Optional redirects** — If you want `/terms` and `/privacy` to redirect to `/legal/terms` and `/legal/privacy`, add redirects in `next.config.js` or Vercel.
4. **Verify** — After deploy:
   - Open `/legal/terms`, `/legal/privacy`, `/legal/employer-agreement`, `/how-disputes-work`, `/compliance` (no login).
   - Sign in as admin, open `/admin/fraud-workflow`, complete checklist + status + notes, submit; confirm row in `audit_logs` with `entity_type = 'fraud_investigation'`.
   - Sign out and visit `/admin/fraud-workflow` — should redirect to sign-in.

## Production readiness

- No mock or placeholder content; all copy is production-oriented.
- Reusable `LegalPageLayout` and shared styling.
- Middleware and layout together enforce admin-only access for `/admin/fraud-workflow`.
- Legal pages are public; no database additions required beyond existing `audit_logs`.
