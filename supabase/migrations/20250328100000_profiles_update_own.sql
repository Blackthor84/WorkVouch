-- Allow authenticated user to update own profile row (e.g. onboarding_completed).
-- Required for POST /api/onboarding/complete.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
