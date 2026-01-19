# Database Migration Instructions

## If You Get "relation already exists" Errors

If you're seeing errors like `relation "profiles" already exists`, it means your base schema is already set up. Use the safe migration script instead.

## Step 1: Check What's Already Set Up

Run this query in Supabase SQL Editor to see what tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## Step 2: Run Safe Migration

**If your base schema (`schema.sql`) is already set up**, run:

```sql
-- Run: supabase/migration_safe.sql
```

This script will:
- ✅ Add `stripe_customer_id` column to profiles (if missing)
- ✅ Create subscription types and tables (if missing)
- ✅ Create notifications table (if missing)
- ✅ Create employer_purchases table (if missing)
- ✅ Create coworker_matches table (if missing)
- ✅ Create all indexes (if missing)
- ✅ Set up RLS policies

## Step 3: Run Version 2 Functions

After the safe migration, run the functions from `schema_v2_updates.sql`:

```sql
-- Copy and paste ONLY the functions from schema_v2_updates.sql
-- Skip the CREATE TABLE statements (they're already in migration_safe.sql)
```

Or run the complete `schema_v2_updates.sql` - it uses `CREATE TABLE IF NOT EXISTS` so it should be safe.

## Step 4: Run Subscription Functions

Run the functions from `schema_v2_subscriptions.sql`:

```sql
-- Copy and paste the functions from schema_v2_subscriptions.sql
-- Skip the CREATE TABLE statements (they're in migration_safe.sql)
```

## Quick Fix for Current Error

If you just need to add the `stripe_customer_id` column right now:

```sql
-- Run this single command:
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id);
```

## Full Setup (First Time)

If you're setting up from scratch:

1. Run `supabase/schema.sql` (base schema)
2. Run `supabase/migration_safe.sql` (Version 2 additions)
3. Run functions from `supabase/schema_v2_updates.sql`
4. Run functions from `supabase/schema_v2_subscriptions.sql`

## Troubleshooting

**Error: "column already exists"**
- The column is already there, you can skip that step

**Error: "type already exists"**
- The enum type already exists, skip that step

**Error: "policy already exists"**
- Drop the policy first, then recreate:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ...
```
