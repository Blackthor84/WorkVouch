-- ============================================================================
-- FIX YOUR EMPLOYER ROLE
-- ============================================================================
-- Run this to set your account to employer role
-- Replace 'your-email@example.com' with your actual email
-- ============================================================================

-- Update profiles.role
UPDATE public.profiles
SET role = 'employer'
WHERE email = 'your-email@example.com';

-- Update user_roles table
UPDATE public.user_roles
SET role = 'employer'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'your-email@example.com');

-- If user_roles entry doesn't exist, create it
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employer'
FROM public.profiles
WHERE email = 'your-email@example.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = public.profiles.id AND role = 'employer'
);

-- Verify it worked
SELECT 
  p.email,
  p.role as profile_role,
  ur.role as user_roles_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'employer'
WHERE p.email = 'your-email@example.com';
