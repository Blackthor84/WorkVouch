-- ============================================================================
-- Enterprise Intelligence Audit — Add nullable/safe columns for scoring
-- ============================================================================
-- All columns nullable or safe default. Does not break existing queries.
-- Run after risk_intelligence_v1_migration.sql and intelligence_profiles_columns.sql if present.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES — intelligence scoring fields
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS career_stability_score NUMERIC DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS network_density_score NUMERIC DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dispute_integrity_score NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.profiles.trust_score IS 'Denormalized trust score 0–100. Engine writes; UI gated by feature flag.';
COMMENT ON COLUMN public.profiles.career_stability_score IS 'Tenure/job stability 0–100. Silent engine.';
COMMENT ON COLUMN public.profiles.network_density_score IS 'Network density 0–100. Silent engine.';
COMMENT ON COLUMN public.profiles.dispute_integrity_score IS 'Dispute resolution integrity 0–100. Silent engine.';
COMMENT ON COLUMN public.profiles.rehire_probability_score IS 'Rehire probability 0–100. Silent engine.';

-- ----------------------------------------------------------------------------
-- EMPLOYER_ACCOUNTS — intelligence scoring fields
-- ----------------------------------------------------------------------------
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS workforce_risk_index NUMERIC DEFAULT 0;

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS verification_velocity_score NUMERIC DEFAULT 0;

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS rehire_density_score NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.employer_accounts.workforce_risk_index IS 'Aggregate workforce risk 0–100. Silent engine.';
COMMENT ON COLUMN public.employer_accounts.verification_velocity_score IS 'Verification velocity 0–100. Silent engine.';
COMMENT ON COLUMN public.employer_accounts.rehire_density_score IS 'Rehire density 0–100. Silent engine.';

-- ----------------------------------------------------------------------------
-- VERIFICATION_REPORTS — intelligence fields (table may exist from usage tracking)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_reports') THEN
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS risk_snapshot JSONB;
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS reference_velocity_score NUMERIC;
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS inconsistency_score NUMERIC;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ----------------------------------------------------------------------------
-- EMPLOYER_DISPUTES — dispute resolution score
-- ----------------------------------------------------------------------------
ALTER TABLE public.employer_disputes
  ADD COLUMN IF NOT EXISTS dispute_resolution_score NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.employer_disputes.dispute_resolution_score IS 'Resolution integrity 0–100. Silent engine.';
