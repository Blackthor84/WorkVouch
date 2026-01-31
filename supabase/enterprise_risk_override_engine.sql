-- ============================================================================
-- Enterprise Risk Override Engine (Hidden, Locked, Non-UI)
-- ============================================================================
-- risk_model_configs table, industry presets, verification_reports columns,
-- employer_accounts.enterprise_override_enabled. RLS: service role only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RISK_MODEL_CONFIGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_model_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  industry_type TEXT NOT NULL,
  tenure_weight NUMERIC NOT NULL DEFAULT 1,
  reference_weight NUMERIC NOT NULL DEFAULT 1,
  rehire_weight NUMERIC NOT NULL DEFAULT 1,
  dispute_weight NUMERIC NOT NULL DEFAULT 1,
  gap_weight NUMERIC NOT NULL DEFAULT 1,
  fraud_weight NUMERIC NOT NULL DEFAULT 1,
  override_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_risk_model_configs_company ON public.risk_model_configs(company_id)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_risk_model_configs_industry ON public.risk_model_configs(industry_type);

COMMENT ON TABLE public.risk_model_configs IS 'Enterprise risk model overrides. Service role only. Not exposed in UI.';

ALTER TABLE public.risk_model_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_model_configs_service_role_only" ON public.risk_model_configs;
CREATE POLICY "risk_model_configs_service_role_only"
  ON public.risk_model_configs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- No SELECT/INSERT/UPDATE/DELETE for authenticated or anon; only service_role.

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_risk_model_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_risk_model_configs_updated_at ON public.risk_model_configs;
CREATE TRIGGER set_risk_model_configs_updated_at
  BEFORE UPDATE ON public.risk_model_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_risk_model_configs_updated_at();

-- ----------------------------------------------------------------------------
-- 2. INDUSTRY PRESETS (SEED) — idempotent
-- ----------------------------------------------------------------------------
INSERT INTO public.risk_model_configs (company_id, industry_type, tenure_weight, reference_weight, rehire_weight, dispute_weight, gap_weight, fraud_weight, override_enabled)
SELECT NULL, 'general', 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, false
WHERE NOT EXISTS (SELECT 1 FROM public.risk_model_configs WHERE company_id IS NULL AND industry_type = 'general');

INSERT INTO public.risk_model_configs (company_id, industry_type, tenure_weight, reference_weight, rehire_weight, dispute_weight, gap_weight, fraud_weight, override_enabled)
SELECT NULL, 'security', 1.0, 1.0, 0.8, 1.4, 1.0, 1.3, false
WHERE NOT EXISTS (SELECT 1 FROM public.risk_model_configs WHERE company_id IS NULL AND industry_type = 'security');

INSERT INTO public.risk_model_configs (company_id, industry_type, tenure_weight, reference_weight, rehire_weight, dispute_weight, gap_weight, fraud_weight, override_enabled)
SELECT NULL, 'healthcare', 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, false
WHERE NOT EXISTS (SELECT 1 FROM public.risk_model_configs WHERE company_id IS NULL AND industry_type = 'healthcare');

INSERT INTO public.risk_model_configs (company_id, industry_type, tenure_weight, reference_weight, rehire_weight, dispute_weight, gap_weight, fraud_weight, override_enabled)
SELECT NULL, 'logistics', 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, false
WHERE NOT EXISTS (SELECT 1 FROM public.risk_model_configs WHERE company_id IS NULL AND industry_type = 'logistics');

INSERT INTO public.risk_model_configs (company_id, industry_type, tenure_weight, reference_weight, rehire_weight, dispute_weight, gap_weight, fraud_weight, override_enabled)
SELECT NULL, 'construction', 1.0, 1.0, 1.0, 1.1, 1.0, 1.0, false
WHERE NOT EXISTS (SELECT 1 FROM public.risk_model_configs WHERE company_id IS NULL AND industry_type = 'construction');

-- ----------------------------------------------------------------------------
-- 3. VERIFICATION_REPORTS — risk_score, risk_metadata
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_reports') THEN
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS risk_score NUMERIC;
    ALTER TABLE public.verification_reports ADD COLUMN IF NOT EXISTS risk_metadata JSONB;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 4. EMPLOYER_ACCOUNTS — enterprise_override_enabled
-- ----------------------------------------------------------------------------
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS enterprise_override_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.employer_accounts.enterprise_override_enabled IS 'When true, company-specific risk_model_config override may be used. Hidden; not in UI.';
