-- ============================================================================
-- MAKE YOURSELF SUPERADMIN
-- ============================================================================
-- This script adds the 'superadmin' role to your account
-- Superadmin has full access to everything in the system
-- ============================================================================

-- IMPORTANT: First run supabase/add_superadmin_role.sql to add the role to the enum!

-- Step 1: Add superadmin role to your account
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Verify it worked
SELECT 
  ur.user_id,
  ur.role,
  p.email,
  p.full_name,
  p.created_at
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE p.email = 'your-email@example.com'
ORDER BY ur.role;

-- You should see 'superadmin' in the role column

-- ============================================================================
-- BONUS: Add superadmin + admin + employer all at once
-- ============================================================================

-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employer'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
