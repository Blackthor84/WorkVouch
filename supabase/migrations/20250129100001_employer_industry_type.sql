-- ============================================================================
-- employer_accounts.industry_type for industry-adjusted trust scoring
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.employer_industry_type AS ENUM (
    'security',
    'healthcare',
    'logistics',
    'warehouse',
    'retail',
    'hospitality',
    'law_enforcement'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS industry_type public.employer_industry_type NULL;

COMMENT ON COLUMN public.employer_accounts.industry_type IS 'Employer industry for weighted trust score display. Optional.';
