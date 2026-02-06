-- ============================================================================
-- SANDBOX V2 — Enterprise wiring: sandbox_features, peer review scores, employment record fields
-- ============================================================================

-- 1. Sandbox features per session (for GET /features and auto-seed on session create)
CREATE TABLE IF NOT EXISTS public.sandbox_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sandbox_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_sandbox_features_sandbox_id ON public.sandbox_features(sandbox_id);

-- 2. Peer review dimension scores (for intelligence aggregation)
ALTER TABLE public.sandbox_peer_reviews
  ADD COLUMN IF NOT EXISTS reliability_score NUMERIC,
  ADD COLUMN IF NOT EXISTS teamwork_score NUMERIC,
  ADD COLUMN IF NOT EXISTS leadership_score NUMERIC,
  ADD COLUMN IF NOT EXISTS stress_performance_score NUMERIC;

-- 3. Employment record dates and verification
ALTER TABLE public.sandbox_employment_records
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;

COMMENT ON TABLE public.sandbox_features IS 'Feature flags per sandbox session; seeded on session create.';
