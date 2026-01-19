# Quick Superadmin Setup - Give Yourself Superadmin Powers

## 🚀 Step-by-Step Instructions

### Step 1: Add Superadmin Role to Database

**First, you need to add 'superadmin' to the user_role enum:**

1. Open Supabase Dashboard → **SQL Editor**
2. Copy and paste the contents of `supabase/add_superadmin_role.sql`
3. Click **Run**

This will:
- Add 'superadmin' to the `user_role` enum
- Create RLS policies for superadmin (full access to everything)
- Set up helper functions

### Step 2: Make Yourself Superadmin

**After Step 1 is done, run this SQL** (replace with YOUR email):

```sql
-- Add superadmin role to your account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;
```

3. **Replace `YOUR_EMAIL_HERE`** with your actual email
4. **Click Run**

### Step 3: Verify It Worked

Run this to check your roles:

```sql
SELECT 
  ur.role,
  p.email,
  p.full_name
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE p.email = 'YOUR_EMAIL_HERE';
```

You should see `superadmin` in the role column.

### Step 4: Refresh Your Session

1. **Sign out** of the app
2. **Sign back in** with your account
3. You should now have superadmin powers!

## 🎯 What Superadmin Can Do

Superadmin has **full access** to:
- ✅ View and manage ALL user profiles
- ✅ View and manage ALL jobs
- ✅ View and manage ALL connections
- ✅ View and manage ALL references
- ✅ View and manage ALL trust scores
- ✅ View and manage ALL user roles
- ✅ Access admin panel
- ✅ Access employer features
- ✅ Bypass all RLS (Row Level Security) restrictions

## ⚡ Quick One-Liner (After Running add_superadmin_role.sql)

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;
```

## 🔥 Add All Roles at Once

Want superadmin + admin + employer? Run:

```sql
-- Replace 'YOUR_EMAIL_HERE' with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employer'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;
```

## ⚠️ Important Notes

- **Superadmin bypasses ALL security checks** - use with caution!
- **Only grant superadmin to trusted accounts**
- **Superadmin can see and modify everything in the database**

---

**That's it! You're now a superadmin! 🎉**
