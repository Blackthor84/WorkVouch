-- ============================================================================
-- Enterprise Scoring Engine + Enterprise Metrics
-- Run in Supabase SQL Editor. Safe to run multiple times (IF NOT EXISTS).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- SCORING MODELS
-- =========================
CREATE TABLE IF NOT EXISTS public.scoring_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  score_type TEXT NOT NULL,
  version INTEGER NOT NULL,
  description TEXT,
  weights JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(score_type, version)
);

CREATE INDEX IF NOT EXISTS idx_scoring_models_type ON public.scoring_models(score_type);

-- =========================
-- USER SCORES (Historical)
-- =========================
CREATE TABLE IF NOT EXISTS public.user_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.scoring_models(id),
  score_type TEXT NOT NULL,
  score_value NUMERIC NOT NULL,
  breakdown JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_scores_user ON public.user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_type ON public.user_scores(score_type);

-- =========================
-- EMPLOYER AGGREGATED SCORES
-- =========================
CREATE TABLE IF NOT EXISTS public.employer_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.scoring_models(id),
  score_type TEXT NOT NULL,
  score_value NUMERIC NOT NULL,
  breakdown JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_scores_employer ON public.employer_scores(employer_id);

-- =========================
-- ENTERPRISE METRICS (simple engine)
-- =========================
CREATE TABLE IF NOT EXISTS public.enterprise_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  rehire_probability INTEGER,
  compatibility_score INTEGER,
  workforce_risk_score INTEGER,
  integrity_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_metrics_user ON public.enterprise_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_metrics_employer ON public.enterprise_metrics(employer_id);

COMMENT ON TABLE public.scoring_models IS 'Versioned scoring models (rehire, integrity, risk, compatibility)';
COMMENT ON TABLE public.user_scores IS 'Historical user score snapshots';
COMMENT ON TABLE public.employer_scores IS 'Employer-aggregated score snapshots';
COMMENT ON TABLE public.enterprise_metrics IS 'Simple enterprise metrics (no UI/API exposure)';
