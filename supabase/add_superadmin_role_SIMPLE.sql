-- ============================================================================
-- ADD SUPERADMIN ROLE - SIMPLE VERSION
-- ============================================================================
-- This is the EASIEST way to add superadmin
-- Just add the enum value first, then run the rest
-- ============================================================================

-- STEP 1: Add 'superadmin' to user_role enum
-- Run this FIRST, then click "Run" or commit
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- ============================================================================
-- IMPORTANT: After running the above, you MUST:
-- 1. Wait for it to complete
-- 2. Then run the rest of this file (or run add_superadmin_role_PART2.sql)
-- ============================================================================

-- STEP 2: Create helper functions (run AFTER Step 1 completes)
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

-- STEP 3: Add RLS policies for superadmin
-- (These give superadmin full access to all tables)

-- Profiles
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

-- User Roles
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

-- Jobs
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

-- Connections
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

-- References
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

-- Trust Scores
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
