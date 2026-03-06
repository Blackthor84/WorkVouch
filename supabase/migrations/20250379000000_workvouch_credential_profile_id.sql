-- ============================================================================
-- WORKVOUCH CREDENTIAL: profile_id (identity root)
-- Table already exists with candidate_id -> profiles(id). Add profile_id for consistency.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'workvouch_credentials' AND column_name = 'profile_id') THEN
    ALTER TABLE public.workvouch_credentials ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    UPDATE public.workvouch_credentials SET profile_id = candidate_id WHERE profile_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_workvouch_credentials_profile_id ON public.workvouch_credentials(profile_id) WHERE profile_id IS NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.workvouch_credentials.profile_id IS 'Identity root: same as candidate_id. For consistent identity architecture.';

-- Trigger: set profile_id = candidate_id on insert when profile_id is null
CREATE OR REPLACE FUNCTION public.workvouch_credentials_set_profile_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NULL THEN
    NEW.profile_id := NEW.candidate_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workvouch_credentials_set_profile_id_trigger ON public.workvouch_credentials;
CREATE TRIGGER workvouch_credentials_set_profile_id_trigger
  BEFORE INSERT ON public.workvouch_credentials
  FOR EACH ROW EXECUTE FUNCTION public.workvouch_credentials_set_profile_id();
