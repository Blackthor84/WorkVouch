-- Allow profiles.role = 'employee' for onboarding. Employees must be able to read own profile after choosing role.

DROP POLICY IF EXISTS "Employees read own profile" ON public.profiles;
CREATE POLICY "Employees read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id AND role = 'employee');
