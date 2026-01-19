# WorkVouch Setup Guide (Supabase Version)

Since you're using Supabase, here's the correct setup process:

## Step 1: Install Dependencies ✅

```bash
npm install
```

**Status:** You've already done this! The Supabase packages are installed.

---

## Step 2: Set Up Supabase Database

### A. Create/Use Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in or create account

2. **Create New Project** (if you don't have one)
   - Click "New Project"
   - Enter project name (e.g., "workvouch")
   - Set database password (save it!)
   - Choose region
   - Click "Create new project"
   - Wait 2-3 minutes

3. **Get Your Connection String**
   - Go to **Settings** → **Database**
   - Scroll to "Connection string"
   - Select "URI" tab
   - Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
   - **Replace `[YOUR-PASSWORD]`** with your actual database password

### B. Get API Credentials

1. **Go to Settings → API**
2. **Copy these values:**
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

---

## Step 3: Configure Environment Variables

Create or update `.env.local` in your project root:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Stripe (if using payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Where to find:**
- `NEXT_PUBLIC_SUPABASE_URL`: Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings → API → anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Settings → API → service_role key (keep secret!)

---

## Step 4: Run Database Schema

**This is NOT `npm run db:push`** - that's for Prisma. For Supabase, you run SQL directly:

1. **Open Supabase SQL Editor**
   - In your Supabase dashboard
   - Click **SQL Editor** in left sidebar

2. **Run the Schema**
   - Open `supabase/schema.sql` in your project
   - Copy ALL the SQL
   - Paste into Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)

3. **Verify Tables Created**
   - Go to **Table Editor** in Supabase
   - You should see tables: `profiles`, `user_roles`, `jobs`, `connections`, `references`, `trust_scores`, etc.

---

## Step 5: Create Admin User (Optional)

**This is NOT `npm run create-superadmin`** - that script was for Prisma.

For Supabase, create admin manually:

1. **Sign up a user** through the app at http://localhost:3000/auth/signup

2. **Get the User ID**
   - Go to Supabase Dashboard → **Authentication** → **Users**
   - Find your user by email
   - Copy the User ID (UUID)

3. **Add Admin Role**
   - Go to **SQL Editor** in Supabase
   - Run this SQL (replace with your user ID):
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('your-user-id-here', 'admin')
   ON CONFLICT DO NOTHING;
   ```

4. **Or use Table Editor**
   - Go to **Table Editor** → `user_roles`
   - Click "Insert row"
   - Enter:
     - `user_id`: Your user ID
     - `role`: `admin`
   - Save

---

## Step 6: Start Development Server

```bash
npm run dev
```

Then open: http://localhost:3000

---

## Summary: What's Different from Prisma Setup

| Prisma Setup | Supabase Setup |
|-------------|----------------|
| `npm run db:push` | Run SQL in Supabase SQL Editor |
| `npm run create-superadmin` | Manually add role in Supabase |
| `DATABASE_URL` in .env | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Prisma migrations | SQL files in `supabase/` folder |

---

## Quick Checklist

- [ ] `npm install` completed
- [ ] Supabase project created
- [ ] `.env.local` created with Supabase credentials
- [ ] SQL schema run in Supabase SQL Editor
- [ ] Tables visible in Supabase Table Editor
- [ ] Admin user created (optional)
- [ ] `npm run dev` running
- [ ] App loads at http://localhost:3000

---

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Your project SQL files: `supabase/schema.sql`
- Setup instructions: `SETUP_INSTRUCTIONS.md`
