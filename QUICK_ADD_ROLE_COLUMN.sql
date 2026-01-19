-- ============================================================================
-- QUICK: ADD ROLE COLUMN TO PROFILES
-- ============================================================================
-- Run this FIRST before trying to set yourself as superadmin
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- ============================================================================

-- Add role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have 'user' role if not set
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;

-- Set role based on user_roles table (for existing data)
-- This syncs existing roles from user_roles table to profiles.role
UPDATE public.profiles p
SET role = (
  SELECT 
    CASE ur.role::TEXT
      WHEN 'superadmin' THEN 'superadmin'
      WHEN 'admin' THEN 'admin'
      WHEN 'employer' THEN 'employer'
      WHEN 'user' THEN 'user'
      ELSE 'user'
    END
  FROM public.user_roles ur
  WHERE ur.user_id = p.id
  ORDER BY CASE ur.role
    WHEN 'superadmin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'employer' THEN 3
    WHEN 'user' THEN 4
  END
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
);

-- Add constraint to ensure valid roles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_valid_role'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT check_valid_role 
    CHECK (role IN ('user', 'employer', 'admin', 'superadmin'));
  END IF;
END $$;

-- Verify it worked
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmins,
  COUNT(CASE WHEN role = 'employer' THEN 1 END) as employers
FROM public.profiles;
