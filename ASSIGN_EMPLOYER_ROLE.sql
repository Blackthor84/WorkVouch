-- ============================================================================
-- ASSIGN EMPLOYER ROLE TO YOUR ACCOUNT
-- ============================================================================
-- Run this in Supabase SQL Editor to give yourself the employer role
-- Replace 'YOUR_EMAIL@example.com' with your actual email address
-- ============================================================================

-- Option 1: Assign by email (replace with your email)
UPDATE public.profiles
SET role = 'employer'
WHERE email = 'YOUR_EMAIL@example.com';

-- Also add to user_roles table for compatibility
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employer'::user_role
FROM public.profiles
WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Option 2: Assign to your current user (if you know your user ID)
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- UPDATE public.profiles
-- SET role = 'employer'
-- WHERE id = 'YOUR_USER_ID';

-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR_USER_ID', 'employer'::user_role)
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Verify it worked
SELECT 
  id,
  email,
  role,
  full_name
FROM public.profiles
WHERE email = 'YOUR_EMAIL@example.com';

SELECT 
  ur.user_id,
  ur.role,
  p.email
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE p.email = 'YOUR_EMAIL@example.com';
