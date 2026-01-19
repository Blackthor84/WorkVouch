-- ============================================================================
-- RLS POLICIES USING JWT CLAIMS
-- ============================================================================
-- Replaces existing policies with JWT-based role checking
-- This prevents recursion issues
-- ============================================================================

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Drop existing superadmin policies (they cause recursion)
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users view their own data"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users update their own data"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (using JWT claim)
CREATE POLICY "Admins view all users"
  ON public.profiles FOR SELECT
  USING (
    current_setting('request.jwt.claim.role', true) IN ('admin', 'superadmin')
  );

-- Superadmin can update anyone (using JWT claim)
CREATE POLICY "Superadmin update anyone"
  ON public.profiles FOR UPDATE
  USING (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  )
  WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  );

-- Only superadmin can change roles
CREATE POLICY "Only superadmin can change roles"
  ON public.profiles FOR UPDATE
  WITH CHECK (
    -- If role is being changed, user must be superadmin
    CASE 
      WHEN role IS DISTINCT FROM (SELECT role FROM public.profiles WHERE id = profiles.id) THEN
        current_setting('request.jwt.claim.role', true) = 'superadmin'
      ELSE true
    END
  );

-- Prevent deleting superadmin
CREATE POLICY "Do not allow superadmin deletion"
  ON public.profiles FOR DELETE
  USING (
    role != 'superadmin' OR
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  );

-- ============================================================================
-- USER ROLES POLICIES (for backwards compatibility)
-- ============================================================================

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all roles
DROP POLICY IF EXISTS "Superadmins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT
  USING (
    current_setting('request.jwt.claim.role', true) IN ('admin', 'superadmin')
  );

-- Only superadmin can manage roles
DROP POLICY IF EXISTS "Superadmins can manage all user roles" ON public.user_roles;
CREATE POLICY "Only superadmin can manage roles"
  ON public.user_roles FOR ALL
  USING (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  )
  WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  );

-- ============================================================================
-- JOBS POLICIES
-- ============================================================================

-- Drop existing superadmin policies
DROP POLICY IF EXISTS "Superadmins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Superadmins can manage all jobs" ON public.jobs;

-- Admins can view all jobs
CREATE POLICY "Admins view all jobs"
  ON public.jobs FOR SELECT
  USING (
    current_setting('request.jwt.claim.role', true) IN ('admin', 'superadmin')
  );

-- Superadmin can manage all jobs
CREATE POLICY "Superadmin manage all jobs"
  ON public.jobs FOR ALL
  USING (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  )
  WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  );

-- ============================================================================
-- REFERENCES POLICIES
-- ============================================================================

-- Drop existing superadmin policies
DROP POLICY IF EXISTS "Superadmins can view all references" ON public.references;
DROP POLICY IF EXISTS "Superadmins can manage all references" ON public.references;

-- Admins can view all references
CREATE POLICY "Admins view all references"
  ON public.references FOR SELECT
  USING (
    current_setting('request.jwt.claim.role', true) IN ('admin', 'superadmin')
  );

-- Superadmin can manage all references
CREATE POLICY "Superadmin manage all references"
  ON public.references FOR ALL
  USING (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  )
  WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  );

-- ============================================================================
-- TRUST SCORES POLICIES
-- ============================================================================

-- Drop existing superadmin policies
DROP POLICY IF EXISTS "Superadmins can view all trust scores" ON public.trust_scores;
DROP POLICY IF EXISTS "Superadmins can manage all trust scores" ON public.trust_scores;

-- Admins can view all trust scores
CREATE POLICY "Admins view all trust scores"
  ON public.trust_scores FOR SELECT
  USING (
    current_setting('request.jwt.claim.role', true) IN ('admin', 'superadmin')
  );

-- Superadmin can manage all trust scores
CREATE POLICY "Superadmin manage all trust scores"
  ON public.trust_scores FOR ALL
  USING (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  )
  WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'superadmin'
  );
