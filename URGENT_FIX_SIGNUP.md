# ⚠️ URGENT: Fix Signup Error

## The Error

```
Database error saving new user
```

This means the database trigger is failing when trying to create a new user.

## ✅ Quick Fix (Run in Order)

### Step 1: Add Role Column

**Run this FIRST in Supabase SQL Editor:**
```sql
-- Copy and paste: QUICK_ADD_ROLE_COLUMN.sql
```

This adds the `role` column to the `profiles` table.

### Step 2: Fix the Trigger

**Run this SECOND in Supabase SQL Editor:**
```sql
-- Copy and paste: supabase/fix_signup_trigger_SAFE.sql
```

This updates the trigger to handle both employees and employers safely.

## 🔍 Check Supabase Logs

If it still fails, check the actual error:

1. Go to **Supabase Dashboard** → **Logs** → **Postgres Logs**
2. Try signing up again
3. Look for the error message in the logs
4. Share the error message

## 🎯 What Should Happen

After running both SQL files:
- ✅ Employee signup should work
- ✅ Employer signup should work
- ✅ Both get correct roles
- ✅ Both redirect to correct dashboards

---

**Run both SQL files in order, then try signing up again!**
