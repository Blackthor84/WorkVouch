# Complete Admin + Superadmin Setup Guide

## 🚀 Step-by-Step Implementation

### Step 1: Database Setup (Run in Supabase SQL Editor)

**1.1: Add role column to profiles table**
```sql
-- Run: supabase/add_role_column_to_profiles.sql
```

**1.2: Set up JWT role claims**
```sql
-- Run: supabase/setup_jwt_role_claims.sql
```

**1.3: Update RLS policies to use JWT claims**
```sql
-- Run: supabase/rls_policies_with_jwt.sql
```

**1.4: Fix recursion issues (if you already ran superadmin setup)**
```sql
-- Run: FIX_RECURSION_NOW.sql (if you have recursion errors)
```

### Step 2: Supabase Dashboard Configuration

**2.1: Configure JWT Claims**
1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Or go to **Project Settings** → **API** → **JWT Settings**
3. Add custom claim mapping:
   - **Claim Name**: `role`
   - **Value**: `user_metadata.role`

**Note**: Supabase automatically includes `user_metadata` in JWT tokens, so the role will be available as `user.user_metadata.role` in your code.

### Step 3: Set Yourself as Superadmin

**Option A: Via Supabase Table Editor**
1. Go to **Table Editor** → `profiles`
2. Find your row (by email)
3. Set `role` column to `superadmin`
4. Save

**Option B: Via SQL**
```sql
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'YOUR_EMAIL_HERE';
```

**Option C: Update auth metadata too**
```sql
-- Update profile role
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'YOUR_EMAIL_HERE';

-- Update auth metadata (requires service role or admin function)
-- This will be synced automatically by the trigger, but you can also do:
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"superadmin"'
)
WHERE email = 'YOUR_EMAIL_HERE';
```

### Step 4: Test the Setup

1. **Sign out** of the app
2. **Sign back in** with your account
3. You should see **"Admin"** link in navbar
4. Go to `/admin` - should see Admin Dashboard
5. Go to `/superadmin` - should see Superadmin Control
6. Go to `/superadmin/roles` - should see Role Manager

### Step 5: Verify JWT Claims

The role is available in:
- `user.user_metadata.role` (in client/server code)
- `current_setting('request.jwt.claim.role', true)` (in RLS policies)

## 📁 Files Created

### Database
- `supabase/add_role_column_to_profiles.sql` - Adds role column
- `supabase/setup_jwt_role_claims.sql` - Sets up JWT sync
- `supabase/rls_policies_with_jwt.sql` - JWT-based RLS policies

### Pages
- `app/admin/page.tsx` - Admin dashboard (updated)
- `app/admin/users/page.tsx` - User management
- `app/superadmin/page.tsx` - Superadmin panel
- `app/superadmin/roles/page.tsx` - Role manager

### API
- `app/api/admin/users/route.ts` - Admin API endpoint

### Updated Files
- `middleware.ts` - Now checks `user_metadata.role`
- `components/sign-up-form.tsx` - Sets role in user_metadata on signup

## 🔐 How It Works

1. **Role Storage**: Role is stored in `profiles.role` column
2. **JWT Sync**: Trigger syncs role to `auth.users.raw_user_meta_data.role`
3. **JWT Claims**: Supabase includes `user_metadata` in JWT tokens
4. **RLS Policies**: Use `current_setting('request.jwt.claim.role', true)` to check role
5. **Middleware**: Checks `user.user_metadata.role` for route protection

## ⚠️ Important Notes

- **JWT Claims**: Supabase automatically includes `user_metadata` in JWT, but you may need to configure custom claims in the dashboard
- **Role Sync**: The trigger automatically syncs `profiles.role` to `auth.users.raw_user_meta_data.role`
- **RLS Recursion**: Using JWT claims prevents recursion issues
- **Superadmin Protection**: Superadmin cannot be deleted (enforced by RLS policy)

## 🎯 Next Steps

1. Run all SQL migrations in order
2. Set yourself as superadmin
3. Sign out and sign back in
4. Test admin and superadmin routes
5. Use `/superadmin/roles` to manage user roles

---

**That's it! Your admin system is ready! 🎉**
