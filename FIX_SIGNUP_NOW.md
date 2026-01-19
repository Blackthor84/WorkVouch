# 🔧 Fix Signup Error - Step by Step

## The Error

```
Database error saving new user
```

## ✅ Solution (Run in Order)

### Step 1: Diagnose the Problem

**Run this FIRST in Supabase SQL Editor:**
```sql
-- Copy and paste: supabase/DIAGNOSE_SIGNUP_ERROR.sql
```

This will tell you:
- ✅ If the `role` column exists
- ✅ What columns the `profiles` table has
- ✅ If the trigger function exists
- ✅ What roles are valid

**Share the results** so we know what's wrong.

### Step 2: Add Role Column (If Needed)

**If the diagnosis says "Role column DOES NOT EXIST":**

Run this in Supabase SQL Editor:
```sql
-- Copy and paste: QUICK_ADD_ROLE_COLUMN.sql
```

### Step 3: Fix the Trigger

**Run this in Supabase SQL Editor:**
```sql
-- Copy and paste: supabase/fix_signup_trigger_MINIMAL.sql
```

This creates the simplest possible trigger that will work.

### Step 4: Test Signup

1. Try signing up as an **Employee**
2. Try signing up as an **Employer**
3. Both should work now!

## 🔍 If Still Failing

**Check Supabase Postgres Logs:**

1. Go to **Supabase Dashboard** → **Logs** → **Postgres Logs**
2. Try signing up again
3. Look for the **red error message**
4. **Copy the full error** and share it

The error will tell us exactly what's wrong (e.g., "column role does not exist" or "invalid input syntax").

---

**Run Step 1 first to diagnose, then follow the steps based on the results!**
