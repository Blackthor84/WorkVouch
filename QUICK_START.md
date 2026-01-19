# Quick Start Guide - How to Start the App

## 🚀 Step-by-Step Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory with:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (Optional - only needed for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...  # Basic plan price ID ($49/mo)
STRIPE_PRICE_PRO=price_...    # Pro plan price ID ($99/mo)

# App URL (Optional - for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**To get your Supabase credentials:**
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon public" key

### 3. Set Up Database
Run these SQL files in Supabase SQL Editor (in order):

1. **`supabase/schema.sql`** - Main database schema
2. **`supabase/workvouch_schema_additions.sql`** - WorkVouch tables (employer_accounts, disputes, etc.)
3. **`supabase/fix_signup_trigger_WITH_ROLES.sql`** - Signup trigger with employer account creation

### 4. Start the Development Server
```bash
npm run dev
```

### 5. Open Your Browser
Navigate to: **http://localhost:3000**

---

## ✅ That's It!

The app should now be running. You can:
- Sign up as an employee or employer
- Add job history
- Search employees (if you're an employer with a paid plan)
- Access admin features (if you're a superadmin)

---

## 🔧 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### "Supabase connection error"
- Check your `.env.local` file has correct Supabase credentials
- Make sure you've run the database migrations

### "Port 3000 already in use"
```bash
# Use a different port
npm run dev -- -p 3001
```

### Database errors
- Make sure you've run all SQL files in Supabase SQL Editor
- Check that the `employer_accounts` table exists

---

## 📝 Next Steps

1. **Create a superadmin account:**
   - Run `MAKE_AJAYE_SUPERADMIN.sql` in Supabase SQL Editor (or create your own)

2. **Test employer signup:**
   - Sign up as an employer
   - Check that `employer_accounts` entry was created automatically

3. **Set up Stripe (optional):**
   - Create products in Stripe Dashboard
   - Add price IDs to `.env.local`
   - Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`

---

## 🎯 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```