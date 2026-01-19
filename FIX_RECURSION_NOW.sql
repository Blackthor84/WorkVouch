-- ============================================================================
-- FIX SUPERADMIN RLS RECURSION - RUN THIS NOW
-- ============================================================================
-- This fixes the infinite recursion error you're seeing
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it
-- ============================================================================

-- Step 1: Create a SECURITY DEFINER function to check if user is superadmin
-- This function bypasses RLS, so it won't cause recursion
CREATE OR REPLACE FUNCTION public.check_is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  -- It directly queries user_roles without triggering RLS policies
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop all problematic superadmin policies
DROP POLICY IF EXISTS "Superadmins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Superadmins can manage all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Superadmins can view all connections" ON public.connections;
DROP POLICY IF EXISTS "Superadmins can view all references" ON public.references;
DROP POLICY IF EXISTS "Superadmins can manage all references" ON public.references;
DROP POLICY IF EXISTS "Superadmins can view all trust scores" ON public.trust_scores;
DROP POLICY IF EXISTS "Superadmins can manage all trust scores" ON public.trust_scores;

-- Step 3: Recreate user_roles policies using the function (non-recursive)
-- Users can view their own roles (simple check, no recursion)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Superadmins can view all user roles (using function to avoid recursion)
CREATE POLICY "Superadmins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.check_is_superadmin());

-- Users can insert their own role (simple check, no recursion)
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Superadmins can manage all user roles (using function to avoid recursion)
CREATE POLICY "Superadmins can manage all user roles"
  ON public.user_roles FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Step 4: Recreate all other superadmin policies using the function
-- This prevents recursion in all tables

-- Profiles
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.check_is_superadmin());

CREATE POLICY "Superadmins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Jobs
CREATE POLICY "Superadmins can view all jobs"
  ON public.jobs FOR SELECT
  USING (public.check_is_superadmin());

CREATE POLICY "Superadmins can manage all jobs"
  ON public.jobs FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Connections
CREATE POLICY "Superadmins can view all connections"
  ON public.connections FOR SELECT
  USING (public.check_is_superadmin());

-- References
CREATE POLICY "Superadmins can view all references"
  ON public.references FOR SELECT
  USING (public.check_is_superadmin());

CREATE POLICY "Superadmins can manage all references"
  ON public.references FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Trust Scores
CREATE POLICY "Superadmins can view all trust scores"
  ON public.trust_scores FOR SELECT
  USING (public.check_is_superadmin());

CREATE POLICY "Superadmins can manage all trust scores"
  ON public.trust_scores FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Superadmin recursion fix applied successfully!';
  RAISE NOTICE 'All superadmin policies now use SECURITY DEFINER function to avoid recursion.';
END $$;
