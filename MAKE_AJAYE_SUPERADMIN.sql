-- ============================================================================
-- MAKE ajayeaglin@gmail.com SUPERADMIN WITH FULL ACCESS
-- ============================================================================
-- Run this in Supabase SQL Editor
-- This will give ajayeaglin@gmail.com superadmin role and all permissions
-- ============================================================================

-- Step 1: Ensure superadmin role exists in enum (if not already added)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'superadmin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'superadmin';
  END IF;
END $$;

-- Step 2: Update profiles.role to superadmin
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'ajayeaglin@gmail.com';

-- Step 3: Add superadmin role to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::user_role
FROM public.profiles
WHERE email = 'ajayeaglin@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'superadmin'::user_role;

-- Step 4: Also add employer and admin roles for maximum access
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employer'::user_role
FROM public.profiles
WHERE email = 'ajayeaglin@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM public.profiles
WHERE email = 'ajayeaglin@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 5: Verify it worked
SELECT 
  p.id,
  p.email,
  p.role as profile_role,
  p.full_name,
  array_agg(ur.role::text) as all_roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.email = 'ajayeaglin@gmail.com'
GROUP BY p.id, p.email, p.role, p.full_name;
