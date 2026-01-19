-- ============================================================================
-- ADD ROLE COLUMN TO PROFILES TABLE
-- ============================================================================
-- Adds a role column to the profiles table for direct role management
-- This works alongside the user_roles table for backwards compatibility
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
UPDATE public.profiles p
SET role = (
  SELECT ur.role::TEXT
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
ALTER TABLE public.profiles
ADD CONSTRAINT check_valid_role 
CHECK (role IN ('user', 'employer', 'admin', 'superadmin'));
