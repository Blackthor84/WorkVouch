# Quick Admin Setup - Give Yourself Admin Powers

## 🚀 Fastest Way (One SQL Command)

1. **Open Supabase SQL Editor**
2. **Copy and paste this SQL** (replace with YOUR email):

```sql
-- Add admin role to your account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;
```

3. **Replace `YOUR_EMAIL_HERE`** with your actual email (the one you used to sign up)
4. **Click Run**

## ✅ Verify It Worked

After running the SQL, run this to check:

```sql
-- Check your roles
SELECT 
  ur.role,
  p.email,
  p.full_name
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE p.email = 'YOUR_EMAIL_HERE';
```

You should see `admin` in the role column.

## 🔄 Refresh Your Session

1. **Sign out** of the app (if logged in)
2. **Sign back in** with your account
3. You should now see **"Admin"** in the navbar
4. Go to **http://localhost:3000/admin** to access admin panel

## 🎯 Add Multiple Roles

Want admin + employer powers? Run both:

```sql
-- Add admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add employer role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employer'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;
```

## ⚠️ Troubleshooting

**"No rows returned" or "0 rows affected":**
- Check that your email is correct (case-sensitive)
- Make sure you've signed up first
- Check that the user exists in Supabase → Authentication → Users

**"Admin link not showing":**
- Sign out and sign back in
- Clear browser cache
- Check browser console (F12) for errors

**"Relation user_roles does not exist":**
- You need to run the main schema first: `supabase/schema.sql`

---

**That's it! You're now an admin! 🎉**
