-- ============================================================================
-- ADD SUPERADMIN ROLE
-- ============================================================================
-- Adds 'superadmin' to the user_role enum and creates superadmin capabilities
-- 
-- IMPORTANT: PostgreSQL requires enum values to be committed before use.
-- Run this file in TWO SEPARATE transactions:
-- 1. First: Run only the enum addition (Step 1)
-- 2. Second: Run the rest (Steps 2-4)
-- ============================================================================

-- ============================================================================
-- STEP 1: Add 'superadmin' to user_role enum
-- ============================================================================
-- RUN THIS FIRST, THEN COMMIT/CLOSE THE TRANSACTION
-- Then run the rest of the file in a NEW transaction
-- ============================================================================

DO $$ 
BEGIN
  -- Check if 'superadmin' value already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'superadmin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    -- Add 'superadmin' to existing enum
    ALTER TYPE user_role ADD VALUE 'superadmin';
  END IF;
END $$;

-- ============================================================================
-- STOP HERE - COMMIT THIS TRANSACTION FIRST!
-- Then run Steps 2-4 in a NEW transaction
-- ============================================================================

-- Step 2: Create a function to check for superadmin (highest privilege)
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

-- Step 3: Create a function to check for admin OR superadmin
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

-- Step 4: Update RLS policies to allow superadmin full access
-- Superadmins can view all profiles
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Superadmins can manage all profiles
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
CREATE POLICY "Superadmins can manage all profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Superadmins can view all user roles
DROP POLICY IF EXISTS "Superadmins can view all user roles" ON public.user_roles;
CREATE POLICY "Superadmins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Superadmins can manage all user roles
DROP POLICY IF EXISTS "Superadmins can manage all user roles" ON public.user_roles;
CREATE POLICY "Superadmins can manage all user roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Superadmins can view all jobs
DROP POLICY IF EXISTS "Superadmins can view all jobs" ON public.jobs;
CREATE POLICY "Superadmins can view all jobs"
  ON public.jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Superadmins can manage all jobs
DROP POLICY IF EXISTS "Superadmins can manage all jobs" ON public.jobs;
CREATE POLICY "Superadmins can manage all jobs"
  ON public.jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Superadmins can view all connections
DROP POLICY IF EXISTS "Superadmins can view all connections" ON public.connections;
CREATE POLICY "Superadmins can view all connections"
  ON public.connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Superadmins can view all references
DROP POLICY IF EXISTS "Superadmins can view all references" ON public.references;
CREATE POLICY "Superadmins can view all references"
  ON public.references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Superadmins can manage all references
DROP POLICY IF EXISTS "Superadmins can manage all references" ON public.references;
CREATE POLICY "Superadmins can manage all references"
  ON public.references FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Superadmins can view all trust scores
DROP POLICY IF EXISTS "Superadmins can view all trust scores" ON public.trust_scores;
CREATE POLICY "Superadmins can view all trust scores"
  ON public.trust_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Superadmins can manage all trust scores
DROP POLICY IF EXISTS "Superadmins can manage all trust scores" ON public.trust_scores;
CREATE POLICY "Superadmins can manage all trust scores"
  ON public.trust_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Superadmin role added successfully!';
  RAISE NOTICE 'You can now assign superadmin role to users.';
END $$;
