-- Role-based access: workers and employers can read own profile only.
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Workers: can SELECT own row when role = 'worker' (or legacy 'user')
DROP POLICY IF EXISTS "Workers only" ON public.profiles;
CREATE POLICY "Workers only"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    AND (role = 'worker' OR role = 'user')
  );

-- Employers: can SELECT own row when role = 'employer' (add employer-only rules later as needed)
DROP POLICY IF EXISTS "Employers read own profile" ON public.profiles;
CREATE POLICY "Employers read own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    AND role = 'employer'
  );

-- Admins/superadmins: can SELECT own profile for auth callback and admin UI
DROP POLICY IF EXISTS "Admins read own profile" ON public.profiles;
CREATE POLICY "Admins read own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    AND role IN ('admin', 'superadmin')
  );

-- Signup: authenticated user can insert their own profile row once
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
