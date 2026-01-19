# ⚠️ Setup Role Column First!

## The Problem

You're trying to set your role to `superadmin`, but the `role` column doesn't exist yet in the `profiles` table.

## ✅ Quick Fix

**Run this SQL FIRST:**

1. Open Supabase Dashboard → **SQL Editor**
2. Copy the **ENTIRE contents** of `QUICK_ADD_ROLE_COLUMN.sql`
3. Paste and **Run** it

This will:
- Add the `role` column to `profiles` table
- Set all existing users to `role='user'`
- Sync roles from `user_roles` table (if you have existing roles)
- Create an index for faster lookups
- Add a constraint to ensure valid roles

## ✅ Then Set Yourself as Superadmin

**After the column is added, run this:**

```sql
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'YOUR_EMAIL_HERE';
```

Replace `YOUR_EMAIL_HERE` with your actual email.

## 📋 Full Setup Order

If you're setting up everything from scratch, run SQL files in this order:

1. **First**: `QUICK_ADD_ROLE_COLUMN.sql` (adds the role column)
2. **Second**: `supabase/setup_jwt_role_claims.sql` (sets up JWT sync)
3. **Third**: `supabase/rls_policies_with_jwt.sql` (updates RLS policies)
4. **Fourth**: `supabase/update_handle_new_user_for_role.sql` (updates signup trigger)
5. **Fifth**: Set yourself as superadmin (the SQL above)

---

**Run `QUICK_ADD_ROLE_COLUMN.sql` now!**
