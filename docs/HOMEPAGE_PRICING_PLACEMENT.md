# Homepage & Pricing Page – Placement & Styling

## Homepage (`app/(public)/page.tsx`)

### Section order (top to bottom)

1. **Hero** – `HeroInteractive`  
   Headline: “Professional Identity. Controlled by You.”  
   Subheadline: “Verified employment. Real coworker validation. Transparent trust scores.”  
   Supporting copy: WorkVouch confirms work history via overlapping employment records and structured peer validation.

2. **Industry Strip** – `IndustryPositioning`  
   Title: “Built for Reliability-Based Industries.”  
   Six items with icons: Warehouse & Logistics, Security, Law Enforcement, Healthcare, Retail, Hospitality.  
   Supporting text: work history transparency, reliability, accountability.

3. **How It Works** – `HowWorkVouchWorks`  
   Four steps: Add Employment History → Confirm Overlap → Build Verified Reputation → Stay in Control.  
   Single row of cards on desktop; responsive grid on smaller screens.

4. **Compliance clarifier** – `TrustClarificationStrip`  
   Subtle strip: WorkVouch is not a background check; does not verify criminal history, licenses, or certifications. Trust scores based on employment overlap and peer validation.

5. **Active Ads** – `ActiveAds`  
6. **How It Works (dual)** – `HowItWorksDual` (For Employees / For Employers)  
7. **Preview Cards** – `PreviewCards`  
8. **Final CTA** – `FinalCTA`  

### Components touched

- **`components/public/HeroInteractive.tsx`** – Supporting paragraph copy only (structured peer validation; “helping professionals build…”).
- **`components/public/IndustryPositioning.tsx`** – Replaced with horizontal industry strip (6 industries, icons + labels).
- **`components/public/HowWorkVouchWorks.tsx`** – Step titles and descriptions refined; section title “How It Works.”
- **`components/public/TrustClarificationStrip.tsx`** – Full compliance sentence (no criminal history, licenses, or certifications).

### Styling

- Premium spacing; no clutter.
- Industry strip: horizontal flex, wrap, centered; icons in rounded boxes; clean typography.
- Compliance strip: subtle border and background; small, readable text.

---

## Pricing Page (`app/(public)/pricing/page.tsx`)

### Section order

1. **Hero** – “Simple Access to Verified Employment Reputation” / “Choose the level of transparency and workforce insight your organization needs.”  
   Billing toggle: Monthly | Annual (Save 2 months).

2. **Plan cards** – 3 columns (Lite, Pro, Custom). Pro emphasized (ring, shadow, scale, “Most Popular” badge).

3. **Feature comparison grid** – Feature | Lite | Pro | Custom. Pro column visually emphasized (background + ring).

4. **Compliance strip** – Verified employment overlap and peer validation; no background checks or criminal history reports.

5. **Fairness & Transparency** – “Transparent & Structured”: dispute system, appeal process, audit logging, role-based access, secure data handling. Short explanation on review/dispute and trust score recalculation.

6. **Final CTA** – “Bring Verified Employment Transparency Into Your Hiring Process.” Subtext: “Secure billing. Cancel anytime.” Buttons: Start With Lite | Upgrade to Pro.

7. **FAQ** – Unchanged.

### Stripe

- **Lite** and **Pro** use existing Stripe price IDs (Starter and Growth monthly/yearly). No IDs changed.
- **Custom** has no Stripe product; display price $399/mo and CTA “Contact Sales” → `/contact` only.

---

## Design requirements (both pages)

- Premium spacing and clear hierarchy.
- No “hire safer” or compliance-triggering language.
- No positioning as background check, criminal history, license, or certification verification.
- Mobile-optimized; professional tone.
