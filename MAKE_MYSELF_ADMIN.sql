-- ============================================================================
-- MAKE YOURSELF ADMIN
-- ============================================================================
-- This script will add the 'admin' role to your user account
-- ============================================================================

-- Step 1: Find your user ID by email
-- Replace 'your-email@example.com' with your actual email address
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Step 2: After you see your user_id above, use it in the command below
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from Step 1

-- Add admin role to your account
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- OR: Do it all in one step (easier - just replace the email)
-- ============================================================================

-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- Verify it worked
-- ============================================================================

-- Check your roles
SELECT 
  ur.user_id,
  ur.role,
  p.email,
  p.full_name
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE p.email = 'your-email@example.com';

-- ============================================================================
-- BONUS: Add both admin AND employer roles at once
-- ============================================================================

-- Replace 'your-email@example.com' with your actual email
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
