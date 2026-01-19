# Sync Your Role to JWT Metadata

## The Problem

You set your role to `superadmin` in the database, but the JWT token doesn't have it yet. You need to:
1. Update your profile role in the database
2. Sync it to auth metadata
3. Sign out and sign back in to refresh the JWT

## ✅ Quick Fix

### Step 1: Set Your Role in Database

Run this SQL (replace with your email):

```sql
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'ajayeaglin@gmail.com';
```

### Step 2: Sync Role to Auth Metadata

Run this SQL (replace with your email):

```sql
-- Update auth metadata to include role
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"superadmin"'
)
WHERE email = 'ajayeaglin@gmail.com';
```

### Step 3: Refresh Your Session

1. **Sign out** of the app
2. **Sign back in** with your account
3. The JWT will now include your role

### Step 4: Test Admin Access

1. Click **"Admin"** in the navbar
2. You should now see the Admin Dashboard (not the regular dashboard)

## 🔄 Alternative: Use the Trigger

If you ran `supabase/setup_jwt_role_claims.sql`, the trigger should automatically sync roles. But you still need to:

1. Sign out and sign back in to get a fresh JWT token
2. The JWT is generated when you sign in, so it needs to be refreshed

## ⚡ One-Liner (After Setting Role)

After setting `profiles.role = 'superadmin'`, run:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"superadmin"'
)
WHERE id = (SELECT id FROM public.profiles WHERE email = 'ajayeaglin@gmail.com');
```

Then **sign out and sign back in**.

---

**The key is signing out and back in to refresh the JWT token!**
