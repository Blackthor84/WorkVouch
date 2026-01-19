-- ============================================================================
-- FIX SUPERADMIN RLS RECURSION
-- ============================================================================
-- The superadmin policies are causing infinite recursion because they check
-- user_roles table, which itself has RLS policies that check user_roles.
-- 
-- Solution: Use SECURITY DEFINER functions that bypass RLS to check roles
-- ============================================================================

-- Step 1: Drop the problematic superadmin policies on user_roles
DROP POLICY IF EXISTS "Superadmins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can manage all user roles" ON public.user_roles;

-- Step 2: Create a SECURITY DEFINER function to check if user is superadmin
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

-- Step 3: Recreate user_roles policies using the function (non-recursive)
-- Users can view their own roles (simple check, no recursion)
-- This policy already exists, but we'll ensure it's correct
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Superadmins can view all user roles (using function to avoid recursion)
CREATE POLICY "Superadmins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.check_is_superadmin());

-- Users can insert their own role (simple check, no recursion)
-- This policy already exists, but we'll ensure it's correct
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Superadmins can manage all user roles (using function to avoid recursion)
CREATE POLICY "Superadmins can manage all user roles"
  ON public.user_roles FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Step 4: Update all other superadmin policies to use the function
-- This prevents recursion in all tables

-- Profiles
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.check_is_superadmin());

DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
CREATE POLICY "Superadmins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Jobs
DROP POLICY IF EXISTS "Superadmins can view all jobs" ON public.jobs;
CREATE POLICY "Superadmins can view all jobs"
  ON public.jobs FOR SELECT
  USING (public.check_is_superadmin());

DROP POLICY IF EXISTS "Superadmins can manage all jobs" ON public.jobs;
CREATE POLICY "Superadmins can manage all jobs"
  ON public.jobs FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Connections
DROP POLICY IF EXISTS "Superadmins can view all connections" ON public.connections;
CREATE POLICY "Superadmins can view all connections"
  ON public.connections FOR SELECT
  USING (public.check_is_superadmin());

-- References
DROP POLICY IF EXISTS "Superadmins can view all references" ON public.references;
CREATE POLICY "Superadmins can view all references"
  ON public.references FOR SELECT
  USING (public.check_is_superadmin());

DROP POLICY IF EXISTS "Superadmins can manage all references" ON public.references;
CREATE POLICY "Superadmins can manage all references"
  ON public.references FOR ALL
  USING (public.check_is_superadmin())
  WITH CHECK (public.check_is_superadmin());

-- Trust Scores
DROP POLICY IF EXISTS "Superadmins can view all trust scores" ON public.trust_scores;
CREATE POLICY "Superadmins can view all trust scores"
  ON public.trust_scores FOR SELECT
  USING (public.check_is_superadmin());

DROP POLICY IF EXISTS "Superadmins can manage all trust scores" ON public.trust_scores;
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
