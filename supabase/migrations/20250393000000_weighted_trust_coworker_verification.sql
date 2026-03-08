-- ============================================================================
-- Weighted trust scoring for coworker verification
-- 1. profiles: trust_score, verification_count
-- 2. On trust_events insert (event_type = coworker_verified): update target profile
-- 3. Impact = verifier_trust_score × 0.2
-- 4. Validation: verifier and target must share same company and overlapping employment dates
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add columns to profiles (if not present)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trust_score') THEN
    ALTER TABLE public.profiles ADD COLUMN trust_score NUMERIC NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verification_count') THEN
    ALTER TABLE public.profiles ADD COLUMN verification_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.trust_score IS 'Weighted trust score; updated on coworker_verified and other trust events.';
COMMENT ON COLUMN public.profiles.verification_count IS 'Count of coworker verifications received (trust_events event_type = coworker_verified).';

-- ----------------------------------------------------------------------------
-- 2. Validation trigger: coworker_verified only when verifier and target share company and dates overlap
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_coworker_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verifier_id UUID;
  v_target_id UUID;
  v_has_valid_overlap BOOLEAN;
BEGIN
  IF NEW.event_type <> 'coworker_verified' THEN
    RETURN NEW;
  END IF;

  -- Read verifier_id from metadata (or payload for backward compatibility)
  v_verifier_id := (COALESCE(NEW.metadata, NEW.payload) ->> 'verifier_id')::UUID;
  v_target_id := NEW.profile_id;

  IF v_verifier_id IS NULL THEN
    RAISE EXCEPTION 'coworker_verified requires metadata.verifier_id';
  END IF;

  IF v_verifier_id = v_target_id THEN
    RAISE EXCEPTION 'coworker_verified: verifier and target cannot be the same profile';
  END IF;

  -- Same company and overlapping employment dates: exists pair of employment_records
  SELECT EXISTS (
    SELECT 1
    FROM public.employment_records er_verifier
    JOIN public.employment_records er_target
      ON er_verifier.company_normalized = er_target.company_normalized
      AND er_verifier.user_id = v_verifier_id
      AND er_target.user_id = v_target_id
      AND er_verifier.id <> er_target.id
    WHERE (er_verifier.start_date <= COALESCE(er_target.end_date, '9999-12-31'::date))
      AND (COALESCE(er_verifier.end_date, '9999-12-31'::date) >= er_target.start_date)
  ) INTO v_has_valid_overlap;

  IF NOT v_has_valid_overlap THEN
    RAISE EXCEPTION 'coworker_verified: verifier and target must share the same company with overlapping employment dates';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_coworker_verified ON public.trust_events;
CREATE TRIGGER trg_validate_coworker_verified
  BEFORE INSERT ON public.trust_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_coworker_verified();

-- ----------------------------------------------------------------------------
-- 3. After-insert trigger: update target profile trust_score and verification_count
-- impact = verifier_trust_score × 0.2
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_coworker_verified_trust_impact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verifier_id UUID;
  v_verifier_trust_score NUMERIC;
  v_impact NUMERIC;
BEGIN
  IF NEW.event_type <> 'coworker_verified' THEN
    RETURN NEW;
  END IF;

  v_verifier_id := (COALESCE(NEW.metadata, NEW.payload) ->> 'verifier_id')::UUID;
  IF v_verifier_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.trust_score, 0) INTO v_verifier_trust_score
  FROM public.profiles p
  WHERE p.id = v_verifier_id;

  v_verifier_trust_score := COALESCE(v_verifier_trust_score, 0);
  v_impact := v_verifier_trust_score * 0.2;

  UPDATE public.profiles
  SET
    trust_score = COALESCE(trust_score, 0) + v_impact,
    verification_count = COALESCE(verification_count, 0) + 1
  WHERE id = NEW.profile_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_coworker_verified_trust ON public.trust_events;
CREATE TRIGGER trg_apply_coworker_verified_trust
  AFTER INSERT ON public.trust_events
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_coworker_verified_trust_impact();

COMMENT ON FUNCTION public.validate_coworker_verified IS 'BEFORE INSERT: ensures coworker_verified only when verifier and target share company and employment dates overlap.';
COMMENT ON FUNCTION public.apply_coworker_verified_trust_impact IS 'AFTER INSERT: for event_type coworker_verified, adds verifier_trust_score×0.2 to target profile and increments verification_count.';
