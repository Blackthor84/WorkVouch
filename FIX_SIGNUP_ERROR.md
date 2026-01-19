# Fix "Database error saving new user"

## The Problem

The signup is failing with "Database error saving new user". This happens because:
1. The `role` column might not exist in `profiles` table
2. The trigger function might have an error
3. The trigger is trying to insert a role that doesn't match constraints

## ✅ Solution

### Step 1: Add Role Column (If Not Done)

Run this SQL in Supabase:
```sql
-- Run: QUICK_ADD_ROLE_COLUMN.sql
```

### Step 2: Fix the Signup Trigger

Run this SQL in Supabase:
```sql
-- Run: supabase/fix_signup_trigger.sql
```

This will:
- Update the trigger to handle both employees and employers
- Properly set the role based on `user_type`
- Handle errors gracefully

### Step 3: Verify

After running both SQL files:
1. Try signing up as an **Employee**
2. Try signing up as an **Employer**
3. Both should work now

## What the Fixed Trigger Does

1. **Reads `user_type`** from signup metadata
2. **Sets role** to 'employer' if `user_type='employer'`, otherwise 'user'
3. **Creates profile** with the correct role
4. **Adds role to user_roles table** for backwards compatibility
5. **Handles errors** gracefully

## If Still Failing

Check the Supabase logs:
1. Go to **Supabase Dashboard** → **Logs** → **Postgres Logs**
2. Look for errors when you try to sign up
3. Share the error message

---

**Run both SQL files in order, then try signing up again!**
