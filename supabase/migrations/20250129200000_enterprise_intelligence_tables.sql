-- ============================================================================
-- Enterprise Team Fit Intelligence: tables + feature flags
-- Silent background layer; no public API exposure.
-- ============================================================================

-- team_fit_scores: candidate vs employer team baseline alignment
CREATE TABLE IF NOT EXISTS public.team_fit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL DEFAULT '1',
  alignment_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_team_fit_scores_candidate ON public.team_fit_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_team_fit_scores_employer ON public.team_fit_scores(employer_id);
CREATE INDEX IF NOT EXISTS idx_team_fit_scores_updated ON public.team_fit_scores(updated_at DESC);

COMMENT ON TABLE public.team_fit_scores IS 'Enterprise team fit alignment (candidate vs employer baseline). Server-only.';

-- risk_model_outputs: versioned risk model results per candidate/employer
CREATE TABLE IF NOT EXISTS public.risk_model_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  model_version TEXT NOT NULL DEFAULT '1',
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_model_outputs_candidate ON public.risk_model_outputs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_risk_model_outputs_employer ON public.risk_model_outputs(employer_id);
CREATE INDEX IF NOT EXISTS idx_risk_model_outputs_updated ON public.risk_model_outputs(updated_at DESC);

COMMENT ON TABLE public.risk_model_outputs IS 'Risk model outputs. Server-only; never exposed to employees.';

-- network_density_index: reference network density per candidate
CREATE TABLE IF NOT EXISTS public.network_density_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL DEFAULT '1',
  density_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  fraud_confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_network_density_index_candidate ON public.network_density_index(candidate_id);
CREATE INDEX IF NOT EXISTS idx_network_density_index_updated ON public.network_density_index(updated_at DESC);

COMMENT ON TABLE public.network_density_index IS 'Network density and fraud confidence. Server-only.';

-- hiring_confidence_scores: composite hiring confidence (candidate + employer)
CREATE TABLE IF NOT EXISTS public.hiring_confidence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL DEFAULT '1',
  composite_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_hiring_confidence_scores_candidate ON public.hiring_confidence_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hiring_confidence_scores_employer ON public.hiring_confidence_scores(employer_id);
CREATE INDEX IF NOT EXISTS idx_hiring_confidence_scores_updated ON public.hiring_confidence_scores(updated_at DESC);

COMMENT ON TABLE public.hiring_confidence_scores IS 'Composite hiring confidence. Server-only.';

-- updated_at triggers (use existing fn if present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS team_fit_scores_updated_at ON public.team_fit_scores;
CREATE TRIGGER team_fit_scores_updated_at
  BEFORE UPDATE ON public.team_fit_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS risk_model_outputs_updated_at ON public.risk_model_outputs;
CREATE TRIGGER risk_model_outputs_updated_at
  BEFORE UPDATE ON public.risk_model_outputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS network_density_index_updated_at ON public.network_density_index;
CREATE TRIGGER network_density_index_updated_at
  BEFORE UPDATE ON public.network_density_index
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS hiring_confidence_scores_updated_at ON public.hiring_confidence_scores;
CREATE TRIGGER hiring_confidence_scores_updated_at
  BEFORE UPDATE ON public.hiring_confidence_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: service role only (no policies = deny anon/auth; API uses service role)
ALTER TABLE public.team_fit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_model_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_density_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_confidence_scores ENABLE ROW LEVEL SECURITY;

-- Feature flags: enterprise_team_fit, enterprise_intelligence_preview (insert if not exists by key or name)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key') THEN
    INSERT INTO public.feature_flags (name, key, description, is_globally_enabled, visibility_type, required_subscription_tier, created_at, updated_at)
    SELECT 'Enterprise Team Fit', 'enterprise_team_fit', 'Employer UI: Team Fit Intelligence', false, 'ui', 'emp_enterprise', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'enterprise_team_fit');
    INSERT INTO public.feature_flags (name, key, description, is_globally_enabled, visibility_type, required_subscription_tier, created_at, updated_at)
    SELECT 'Enterprise Intelligence Preview', 'enterprise_intelligence_preview', 'Admin-only intelligence preview', false, 'ui', null, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'enterprise_intelligence_preview');
  ELSE
    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Enterprise Team Fit', 'Employer UI: Team Fit Intelligence', false, 'ui', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Enterprise Team Fit');
    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Enterprise Intelligence Preview', 'Admin-only intelligence preview', false, 'ui', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Enterprise Intelligence Preview');
  END IF;
END $$;
