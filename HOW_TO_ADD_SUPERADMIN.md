# How to Add Superadmin Role (Fixing the Enum Error)

## ⚠️ The Problem

PostgreSQL requires enum values to be **committed** before they can be used. You can't add an enum value and use it in the same transaction.

## ✅ Solution: Run in Two Steps

### Step 1: Add the Enum Value

**Run this FIRST in Supabase SQL Editor:**

```sql
-- Add 'superadmin' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
```

**Important:** After running this, wait for it to complete. The Supabase SQL Editor should show "Success" or "0 rows affected" (if it already exists).

### Step 2: Run the Rest

**After Step 1 completes, run this in a NEW query:**

```sql
-- Create helper functions
CREATE OR REPLACE FUNCTION public.is_superadmin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
    AND (role = 'admin' OR role = 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies (copy from add_superadmin_role_PART2.sql or add_superadmin_role_SIMPLE.sql)
-- Or just run the entire add_superadmin_role_PART2.sql file
```

## 🚀 Easiest Method

**Use the simple file:**

1. Open `supabase/add_superadmin_role_SIMPLE.sql`
2. Copy **ONLY the first line** (the `ALTER TYPE` statement)
3. Run it in Supabase SQL Editor
4. Wait for it to complete
5. Then copy and run the **rest of the file** (everything after the `ALTER TYPE` line)

## 📝 Alternative: Use Two Separate Files

1. **First:** Run `supabase/add_superadmin_role.sql` (just the enum part)
2. **Wait for completion**
3. **Then:** Run `supabase/add_superadmin_role_PART2.sql` (functions and policies)

## ✅ Verify It Worked

After both steps, verify the enum value exists:

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
```

You should see: `user`, `employer`, `admin`, `superadmin`

## 🎯 Then Make Yourself Superadmin

After the enum is added, run:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

**That's it! The key is running the enum addition separately from everything else.**
