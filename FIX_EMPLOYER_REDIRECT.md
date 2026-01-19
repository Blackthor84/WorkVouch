# Fix Employer Dashboard Redirect

## The Problem

When you sign up as an employer, you're seeing the employee dashboard instead of the employer dashboard.

## ✅ What I Fixed

1. **Updated `/dashboard` page** - Now checks if user is an employer and redirects to `/employer/dashboard`
2. **The signup form already redirects** - It should redirect employers to `/employer/dashboard` after signup

## 🔍 Check Your Role

If you're still seeing the employee dashboard, your role might not be set correctly. Check this:

### Option 1: Check in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find your user account
3. Check the **User Metadata** - look for `role: "employer"`

### Option 2: Check Database

Run this SQL in Supabase SQL Editor:
```sql
-- Check your role
SELECT 
  p.id,
  p.email,
  p.role as profile_role,
  ur.role as user_roles_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.email = 'your-email@example.com';
```

Replace `'your-email@example.com'` with your actual email.

## 🔧 If Role is Wrong

If your role is not set to `'employer'`, run this SQL:

```sql
-- Set your role to employer (replace with your email)
UPDATE public.profiles
SET role = 'employer'
WHERE email = 'your-email@example.com';

-- Also update user_roles table
UPDATE public.user_roles
SET role = 'employer'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'your-email@example.com');
```

## ✅ After Fixing

1. **Sign out** and **sign in again** (to refresh your session)
2. Go to `/dashboard` - it should redirect you to `/employer/dashboard`
3. Or go directly to `/employer/dashboard`

---

**The dashboard page now automatically redirects employers. If it's still not working, check your role in the database!**
