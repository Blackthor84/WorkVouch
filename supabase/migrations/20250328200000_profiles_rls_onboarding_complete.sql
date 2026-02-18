-- =============================================================================
-- RLS for tables used by /api/onboarding/complete and /api/user/me
-- Table: public.profiles
--   Primary key: id (UUID, REFERENCES auth.users(id) ON DELETE CASCADE)
--   Ownership: id = auth.uid() (one row per user; no user_id column)
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
