# Complete Setup Checklist - Get PeerCV Running

## ✅ Quick Checklist

- [ ] 1. Install Dependencies
- [ ] 2. Set Up Environment Variables (.env.local)
- [ ] 3. Run Database Migrations
- [ ] 4. Run Warehousing Migration (if using warehouse industry)
- [ ] 5. Start Development Server
- [ ] 6. Test the App

---

## Step 1: Install Dependencies

**Command:**
```bash
npm install
```

**What it does:**
- Installs all packages from `package.json`
- Creates `node_modules` folder

**Expected output:**
- Progress bars showing downloads
- "added X packages" when complete

---

## Step 2: Set Up Environment Variables

### Create `.env.local` File

Create a file named `.env.local` in the project root (`C:\Users\ajaye\.cursor\.env.local`)

### Required Variables

**Minimum Required (for basic functionality):**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Full Setup (includes Stripe and service role):**
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Stripe (Required for payments/subscriptions)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# App URL (Required for Stripe redirects)
NEXT_PUBLIC_URL=http://localhost:3000
```

### How to Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### How to Get Stripe Credentials (Optional - only if using payments)

1. Go to https://dashboard.stripe.com
2. Get your API keys from **Developers** → **API keys**
3. Copy:
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. For webhooks, see `STRIPE_SETUP_GUIDE.md`

---

## Step 3: Run Database Migrations

### 3.1 Main Schema

1. Open Supabase Dashboard → **SQL Editor**
2. Open `supabase/schema.sql` from your project
3. **Copy ALL contents** (Ctrl+A, Ctrl+C)
4. **Paste** into Supabase SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. Wait for "Success. No rows returned"

**This creates:**
- All tables (profiles, jobs, connections, references, etc.)
- Indexes
- RLS policies
- Triggers
- Functions

### 3.2 Industry Focus Schema

1. In Supabase SQL Editor, open `supabase/schema_industry_focus.sql`
2. Copy and paste all contents
3. Click **Run**

**This adds:**
- `industry_type` enum
- `industry` column to profiles
- Industry-specific fields table

### 3.3 V2 Updates (Notifications, Employer Tools, etc.)

1. Run `supabase/schema_v2_updates.sql`
2. Run `supabase/schema_v2_subscriptions.sql` (if using subscriptions)
3. Run `supabase/schema_employer_tools.sql` (if using employer features)

### 3.4 Warehousing Industry (NEW)

1. Run `supabase/schema_add_warehousing_industry_FIXED.sql`
2. This adds 'warehousing' to the industry enum and warehouse-specific columns

---

## Step 4: Verify Database Setup

Run this in Supabase SQL Editor to verify:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if industry_type enum exists
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'industry_type');

-- Check if profiles table has warehouse columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'warehouse%';
```

**Expected:**
- Multiple tables listed (profiles, jobs, connections, etc.)
- Enum values: law_enforcement, security, hospitality, retail, warehousing
- Warehouse columns: warehouse_type, equipment_operated, etc.

---

## Step 5: Start Development Server

**Command:**
```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

**If you see errors:**
- Check that `.env.local` exists and has correct values
- Make sure port 3000 is not in use
- Check that all dependencies are installed

---

## Step 6: Test the App

### 6.1 Open the App

1. Open browser: http://localhost:3000
2. You should see the PeerCV landing page

### 6.2 Create Your First Account

1. Click "Get Started Free"
2. Fill out signup form:
   - Full Name
   - Email
   - Industry (select any)
   - Password
3. Click "Create Account"
4. If you selected "Warehousing & Logistics", you'll see warehouse onboarding
5. Otherwise, you'll go to the dashboard

### 6.3 Verify Everything Works

- ✅ Landing page loads
- ✅ Sign up works
- ✅ Dashboard loads after signup
- ✅ Can navigate between pages
- ✅ No console errors (check F12)

---

## Optional: Set Up Stripe (For Payments)

If you want to use Stripe for subscriptions/payments:

1. **Create Stripe Account**: https://stripe.com
2. **Get API Keys**: Dashboard → Developers → API keys
3. **Create Products**: Dashboard → Products → Create products matching `lib/stripe/products.ts`
4. **Set Up Webhook**: See `STRIPE_SETUP_GUIDE.md`
5. **Add to `.env.local`**: All Stripe variables listed above

---

## Troubleshooting

### "npm not recognized"
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

### "Port 3000 already in use"
```bash
# Use a different port
npm run dev -- -p 3001
```

### "Failed to fetch" or "Invalid API key"
- Check `.env.local` exists
- Verify Supabase URL and keys are correct
- No spaces around `=` in `.env.local`
- Restart dev server after changing `.env.local`

### "Relation does not exist" errors
- Run the database migrations (Step 3)
- Make sure you ran `schema.sql` first
- Then run other migration files in order

### "Type industry_type does not exist"
- Run `supabase/schema_industry_focus.sql` first
- Then run `supabase/schema_add_warehousing_industry_FIXED.sql`

### Blank page or "Session Issue"
- Check browser console (F12) for errors
- Verify Supabase credentials in `.env.local`
- Make sure database migrations ran successfully

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for linting errors
npm run lint
```

---

## What's Next?

Once the app is running:

1. **Create an Admin User** (optional):
   - Sign up a user
   - Get their user ID from Supabase Auth dashboard
   - Run: `INSERT INTO public.user_roles (user_id, role) VALUES ('user-id', 'admin');`

2. **Test Features**:
   - Add a job
   - Request coworker verification
   - Build your Trust Score
   - Explore employer dashboard (if you have employer role)

3. **Customize**:
   - Update landing page copy
   - Adjust colors in `tailwind.config.ts`
   - Add more industries if needed

---

**You're all set! The app should be running at http://localhost:3000**
