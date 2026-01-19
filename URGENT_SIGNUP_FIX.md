# ⚠️ URGENT: Fix Signup Error

## The Error

```
Database error saving new user
```

## ✅ Quick Fix - Try This First

**Run this in Supabase SQL Editor:**
```sql
-- Copy and paste: supabase/fix_signup_trigger_WORKING.sql
```

This recreates the trigger to match the original schema exactly.

## 🔍 If That Doesn't Work - Check Logs

**The error is happening in the database trigger. We need to see the actual error:**

1. Go to **Supabase Dashboard**
2. Click **Logs** (left sidebar)
3. Click **Postgres Logs**
4. Try signing up again
5. Look for the **red error message** in the logs
6. **Copy the FULL error message** and share it

The error will tell us exactly what's wrong, for example:
- `column "role" does not exist` → Need to add role column
- `invalid input syntax for type industry_type` → Industry enum issue
- `permission denied for table profiles` → RLS policy issue
- `relation "profiles" does not exist` → Table doesn't exist

## 🎯 Most Likely Issues

1. **Industry enum doesn't have 'warehousing'** → Run warehousing migration
2. **RLS policy blocking insert** → Check RLS policies
3. **Table doesn't exist** → Run full schema.sql
4. **Trigger function has syntax error** → The fix above should resolve this

## 📋 Alternative: Try the Basic Version

If the working version doesn't work, try the absolute simplest:

```sql
-- Copy and paste: supabase/fix_signup_trigger_BASIC.sql
```

This creates a profile with NO role logic - just the basics.

---

**Run the fix SQL, then check Supabase Postgres Logs for the exact error if it still fails!**
