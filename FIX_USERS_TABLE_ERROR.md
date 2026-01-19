# Fix: "relation 'users' does not exist" Error

## The Problem

You're getting this error:
```
ERROR: 42P01: relation "users" does not exist
LINE 1: UPDATE users
```

This happens because **Supabase doesn't have a `public.users` table**. In Supabase, user authentication data is stored in `auth.users`, not `public.users`.

## The Solution

### If you're trying to update user data:

**❌ WRONG:**
```sql
UPDATE users SET ...
```

**✅ CORRECT:**
```sql
-- Use auth.users for auth data
UPDATE auth.users SET ...

-- OR use public.profiles for profile data
UPDATE public.profiles SET ...
```

### Common Scenarios:

#### 1. Updating User Email
```sql
-- Don't do this:
UPDATE users SET email = 'new@email.com';

-- Do this instead:
UPDATE auth.users SET email = 'new@email.com' WHERE id = 'user-id';
```

#### 2. Updating User Profile
```sql
-- Don't do this:
UPDATE users SET full_name = 'John Doe';

-- Do this instead:
UPDATE public.profiles SET full_name = 'John Doe' WHERE id = 'user-id';
```

#### 3. Creating a Profile from Auth User
```sql
-- This is correct:
INSERT INTO public.profiles (id, full_name, email)
SELECT id, email, email
FROM auth.users
WHERE id = 'user-id';
```

## What SQL File Are You Running?

If you're running a SQL file and getting this error, **tell me which file** and I can fix it. The error might be in:
- A file you copied from somewhere
- An old migration file
- A custom SQL query you wrote

## Quick Fix

If you just need to update a user's profile, use:

```sql
-- Update profile (not users table)
UPDATE public.profiles 
SET full_name = 'Your Name'
WHERE id = 'your-user-id-here';
```

## Need Help?

**Share the SQL you're trying to run** and I'll fix it for you!
