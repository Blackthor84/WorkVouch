# PeerCV Version 2 - Complete Setup Guide

## 🚀 What's New in Version 2

- **Stripe Integration**: Full subscription system with multiple tiers for users and employers
- **Pay-Per-Lookup**: One-time payment option for employers ($7.99 per report)
- **Subscription Management**: Monthly/yearly plans with automatic billing
- **Enhanced Coworker Matching**: Automatic detection and notifications when users have overlapping employment
- **Trust Score V2**: Improved calculation with connection bonuses and high-rated reference bonuses
- **Notifications System**: Real-time notifications for matches, references, and purchases
- **Employer Dashboard**: Complete employer portal with purchase history and report viewing
- **Modern UI**: Blue + grey color scheme with full dark mode support

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Stripe account (for payment processing)
- Git (optional)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_CANDIDATE_REPORT=price_... (optional, uses default pricing if not set)
```

### 3. Database Setup

#### Step 1: Run Base Schema

Run the base schema from `supabase/schema.sql` in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of supabase/schema.sql
```

#### Step 2: Run Version 2 Updates

Run the Version 2 updates from `supabase/schema_v2_updates.sql`:

```sql
-- Copy and paste the entire contents of supabase/schema_v2_updates.sql
```

#### Step 3: Run Subscription Schema

Run the subscription schema from `supabase/schema_v2_subscriptions.sql`:

```sql
-- Copy and paste the entire contents of supabase/schema_v2_subscriptions.sql
```

#### Step 4: Set Up Nightly Trust Score Recalculation (Optional)

In Supabase Dashboard → Database → Cron Jobs, create a new cron job:

```sql
-- Run every night at 2 AM UTC
SELECT recalculate_all_trust_scores();
```

Schedule: `0 2 * * *`

### 4. Stripe Setup

#### Step 1: Create Products in Stripe Dashboard

For each product defined in `lib/stripe/products.ts`:

1. Go to Stripe Dashboard → Products
2. Create products matching the names and descriptions
3. Add prices (monthly/yearly as specified):
   - PeerCV Pro: $8.99/month or $84/year
   - PeerCV Elite: $19.99/month or $198/year
   - Employer Lite: $49/month
   - Employer Pro: $149/month
   - Employer Enterprise: $499/month
   - Pay-Per-Lookup: $7.99 (one-time)
4. Copy the Price IDs for each product

**Note**: You'll need to update `components/pricing-section.tsx` with actual Stripe Price IDs, or create a sync script to map product IDs to price IDs.

#### Step 2: Set Up Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### Step 3: Test Webhook Locally (Development)

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret for local testing.

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
├── app/
│   ├── api/stripe/          # Stripe API routes
│   ├── employer/            # Employer pages
│   ├── notifications/       # Notifications page
│   └── ...
├── components/
│   ├── notifications-bell.tsx
│   ├── notifications-list.tsx
│   ├── employer-dashboard.tsx
│   ├── candidate-report-view.tsx
│   └── ...
├── lib/
│   ├── actions/
│   │   ├── notifications.ts
│   │   ├── employer-purchases.ts
│   │   └── ...
│   ├── stripe/
│   │   └── config.ts
│   └── ...
└── supabase/
    ├── schema.sql            # Base schema
    └── schema_v2_updates.sql # Version 2 additions
```

## 🔑 Key Features

### Coworker Matching

When a user adds a job:
1. System automatically searches for other users with overlapping employment at the same company
2. Creates `coworker_matches` records
3. Sends notifications to both users
4. Users can then connect and leave references

### Trust Scoring (V2)

Trust scores are calculated using:
- **Job Count** (25%): Up to 25 points, 2 points per verified job
- **Reference Count** (35%): Up to 35 points, 1 point per reference
- **Average Rating** (25%): Up to 25 points, 5 stars = 25 points
- **High-Rated Refs Bonus** (10%): Up to 10 points for 4+ star references
- **Connection Bonus** (5%): Up to 5 points for confirmed connections

Scores recalculate automatically when jobs/references change, and nightly via cron.

### Stripe Integration

**Purchase Flow:**
1. Employer searches for candidates
2. Clicks "Purchase Report ($29.99)"
3. Redirected to Stripe Checkout
4. On success, redirected to report page
5. Report is permanently accessible

**Webhook Handles:**
- Payment completion → Updates purchase status
- Payment failure → Marks purchase as failed
- Creates notifications for employers

### Notifications

Notifications are created for:
- **Coworker matches**: When overlapping employment is detected
- **Reference requests**: When someone requests a reference
- **Reference received**: When someone leaves you a reference
- **Connection confirmed**: When a connection is accepted
- **Employer purchase**: When a report is successfully purchased

## 🧪 Testing

### Test Stripe Checkout

1. Sign up as an employer (add `employer` role in Supabase)
2. Search for a candidate
3. Click "Purchase Report"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify report is accessible

### Test Coworker Matching

1. Create two user accounts
2. Add jobs at the same company with overlapping dates
3. Check notifications for both users
4. Verify `coworker_matches` table has entries

### Test Trust Scoring

1. Add jobs to a user profile
2. Get references from connections
3. Check trust score updates
4. Verify score calculation matches formula

## 🚨 Troubleshooting

### Stripe Webhook Not Working

- Verify webhook URL is correct
- Check webhook secret matches
- Ensure events are selected in Stripe dashboard
- Check server logs for errors

### Coworker Matches Not Detected

- Verify jobs are not private (`is_private = false`)
- Check company names match exactly (case-insensitive)
- Verify date ranges overlap
- Check `coworker_matches` table for entries

### Trust Scores Not Updating

- Check triggers are enabled
- Verify `trust_scores` table exists
- Run `SELECT update_trust_score('user_id');` manually
- Check for errors in Supabase logs

## 📝 Next Steps

- Add email notifications (optional)
- Implement report expiration (optional)
- Add more payment options (subscriptions, bulk purchases)
- Enhance matching algorithm with more factors
- Add analytics dashboard

## 📄 License

MIT
