# Check What's Wrong with Signup

## The Error

```
Database error saving new user
```

This means the database trigger (`handle_new_user`) is failing.

## 🔍 Find the Exact Error

**Check Supabase Logs:**

1. Go to **Supabase Dashboard**
2. Click **Logs** (left sidebar)
3. Click **Postgres Logs**
4. Try signing up again
5. Look for the **red error message** in the logs
6. **Copy the full error message** and share it

The error will tell us exactly what's wrong (e.g., "column role does not exist" or "invalid input syntax for type user_role").

## ✅ Quick Fixes to Try

### Option 1: Run SQL Files in Order

1. **First**: Run `QUICK_ADD_ROLE_COLUMN.sql`
2. **Second**: Run `supabase/fix_signup_trigger_SIMPLE.sql`

### Option 2: Check if Role Column Exists

Run this SQL to check:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
```

If it returns nothing, the column doesn't exist - run `QUICK_ADD_ROLE_COLUMN.sql`.

### Option 3: Check Current Trigger

Run this SQL to see the current trigger:
```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

## 🎯 Most Likely Issues

1. **Role column doesn't exist** → Run `QUICK_ADD_ROLE_COLUMN.sql`
2. **Trigger has syntax error** → Run `supabase/fix_signup_trigger_SIMPLE.sql`
3. **Role constraint violation** → Check that role value matches enum

---

**Please check the Supabase Postgres Logs and share the exact error message!**
