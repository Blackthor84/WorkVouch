-- ============================================================================
-- SANDBOX V2 — Persistent metrics table (data-driven, no mocks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sandbox_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  profiles_count INT NOT NULL DEFAULT 0,
  employment_records_count INT NOT NULL DEFAULT 0,
  references_count INT NOT NULL DEFAULT 0,
  avg_profile_strength NUMERIC,
  avg_career_health NUMERIC,
  avg_risk_index NUMERIC,
  avg_team_fit NUMERIC,
  avg_hiring_confidence NUMERIC,
  avg_network_density NUMERIC,
  mrr NUMERIC,
  ad_roi NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sandbox_metrics_sandbox_key ON public.sandbox_metrics(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_metrics_sandbox_id ON public.sandbox_metrics(sandbox_id);

COMMENT ON TABLE public.sandbox_metrics IS 'Aggregated sandbox metrics; updated after every generate/insert.';
