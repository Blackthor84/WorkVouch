-- ============================================================================
-- WorkVouch Risk Intelligence Engine v1 — Idempotent migration
-- ============================================================================
-- Run in Supabase SQL Editor.
-- 1. profiles: risk_snapshot, risk_score, risk_score_version, risk_score_confidence, risk_last_calculated
-- 2. employer_accounts: workforce_risk_average, workforce_high_risk_count, workforce_last_calculated
-- 3. rehire_registry table with RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES — risk columns
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_snapshot JSONB;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_score_version TEXT DEFAULT '1.0';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_score_confidence NUMERIC;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_last_calculated TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.risk_snapshot IS 'Risk Intelligence v1: full component snapshot (JSONB).';
COMMENT ON COLUMN public.profiles.risk_score IS 'Risk Intelligence v1: overall score 0–100.';
COMMENT ON COLUMN public.profiles.risk_score_version IS 'Risk engine version (e.g. 1.0).';
COMMENT ON COLUMN public.profiles.risk_score_confidence IS 'Confidence 0–100.';
COMMENT ON COLUMN public.profiles.risk_last_calculated IS 'Last time risk was recalculated.';

-- ----------------------------------------------------------------------------
-- 2. EMPLOYER_ACCOUNTS — workforce risk columns
-- ----------------------------------------------------------------------------
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS workforce_risk_average NUMERIC;

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS workforce_high_risk_count INTEGER DEFAULT 0;

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS workforce_risk_confidence NUMERIC;

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS workforce_last_calculated TIMESTAMPTZ;

COMMENT ON COLUMN public.employer_accounts.workforce_risk_average IS 'Average risk_score of linked employees.';
COMMENT ON COLUMN public.employer_accounts.workforce_high_risk_count IS 'Count of employees with risk_score < 50.';
COMMENT ON COLUMN public.employer_accounts.workforce_risk_confidence IS 'Average risk_score_confidence of linked employees.';
COMMENT ON COLUMN public.employer_accounts.workforce_last_calculated IS 'Last workforce risk calculation.';

-- ----------------------------------------------------------------------------
-- 3. REHIRE_REGISTRY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rehire_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rehire_eligible BOOLEAN DEFAULT true,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employer_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_rehire_registry_employer ON public.rehire_registry(employer_id);
CREATE INDEX IF NOT EXISTS idx_rehire_registry_profile ON public.rehire_registry(profile_id);

COMMENT ON TABLE public.rehire_registry IS 'Rehire eligibility per employer–candidate. Writes via service role; SELECT for employer admins.';

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_rehire_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rehire_registry_updated_at ON public.rehire_registry;
CREATE TRIGGER update_rehire_registry_updated_at
  BEFORE UPDATE ON public.rehire_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_rehire_registry_updated_at();

-- RLS
ALTER TABLE public.rehire_registry ENABLE ROW LEVEL SECURITY;

-- SELECT: employer admins (user has role employer and owns this employer_account)
DROP POLICY IF EXISTS "rehire_registry_select_employer_admin" ON public.rehire_registry;
CREATE POLICY "rehire_registry_select_employer_admin"
  ON public.rehire_registry FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employer_accounts ea
      INNER JOIN public.user_roles ur ON ur.user_id = ea.user_id AND ur.role = 'employer'
      WHERE ea.id = rehire_registry.employer_id
      AND (auth.uid() = ea.user_id OR EXISTS (SELECT 1 FROM public.user_roles a WHERE a.user_id = auth.uid() AND a.role IN ('admin', 'superadmin')))
    )
  );

-- INSERT/UPDATE/DELETE: only via service role (no policy = only service role when RLS on)
-- So we do not create INSERT/UPDATE/DELETE policies; service role bypasses RLS.
