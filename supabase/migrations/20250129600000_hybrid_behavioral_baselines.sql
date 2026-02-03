-- ============================================================================
-- Hybrid Behavioral Baselines: industry + employer baselines for Team Fit,
-- Risk, and Hiring Confidence. Service role writes; restricted reads.
-- ============================================================================

-- industry_behavioral_baselines: macro-level behavioral averages per industry.
-- Service role writes. Public cannot read (admin via app/service role only).
CREATE TABLE IF NOT EXISTS public.industry_behavioral_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  avg_pressure NUMERIC(5,2),
  avg_structure NUMERIC(5,2),
  avg_communication NUMERIC(5,2),
  avg_leadership NUMERIC(5,2),
  avg_reliability NUMERIC(5,2),
  avg_initiative NUMERIC(5,2),
  avg_conflict_risk NUMERIC(5,2),
  avg_tone_stability NUMERIC(5,2),
  sample_size INTEGER NOT NULL DEFAULT 0,
  model_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_industry_behavioral_baselines_industry ON public.industry_behavioral_baselines(industry);
ALTER TABLE public.industry_behavioral_baselines ENABLE ROW LEVEL SECURITY;

-- No SELECT for anon/authenticated; service role only. Admins see via app.
DROP POLICY IF EXISTS "Admins can select industry_behavioral_baselines" ON public.industry_behavioral_baselines;
CREATE POLICY "Admins can select industry_behavioral_baselines"
  ON public.industry_behavioral_baselines FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

COMMENT ON TABLE public.industry_behavioral_baselines IS 'Industry-level behavioral averages. Service role write; admin preview only.';

-- employer_behavioral_baselines: micro-level behavioral averages per employer workforce.
CREATE TABLE IF NOT EXISTS public.employer_behavioral_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL UNIQUE REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  avg_pressure NUMERIC(5,2),
  avg_structure NUMERIC(5,2),
  avg_communication NUMERIC(5,2),
  avg_leadership NUMERIC(5,2),
  avg_reliability NUMERIC(5,2),
  avg_initiative NUMERIC(5,2),
  avg_conflict_risk NUMERIC(5,2),
  avg_tone_stability NUMERIC(5,2),
  employee_sample_size INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_behavioral_baselines_employer ON public.employer_behavioral_baselines(employer_id);
ALTER TABLE public.employer_behavioral_baselines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select employer_behavioral_baselines" ON public.employer_behavioral_baselines;
CREATE POLICY "Admins can select employer_behavioral_baselines"
  ON public.employer_behavioral_baselines FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

COMMENT ON TABLE public.employer_behavioral_baselines IS 'Employer workforce behavioral averages. Service role write; enterprise/admin only.';
