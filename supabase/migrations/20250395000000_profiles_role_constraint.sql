-- Ensure profiles.role exists and constrain to allowed values for onboarding/dashboard.
-- App expects employee | employer for new users; admin/superadmin/worker/user kept for compatibility.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT;
  END IF;
END $$;

-- Allow employee, employer, and legacy/admin values so existing rows remain valid
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('employee', 'employer', 'admin', 'superadmin', 'worker', 'user'));

COMMENT ON COLUMN public.profiles.role IS 'User role: employee (verify job history) or employer (search/verify candidates). Required before dashboard access.';
