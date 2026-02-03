-- ============================================================================
-- Behavioral Intelligence Engine: review_intelligence + behavioral_profile_vector
-- Review text = employment_references.comment (peer references). Admin-only preview.
-- ============================================================================

-- review_intelligence: per-review extracted behavioral signals (AI). Service role write; admin SELECT.
CREATE TABLE IF NOT EXISTS public.review_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.employment_references(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sentiment_score NUMERIC(5,2),
  pressure_score NUMERIC(5,2),
  structure_score NUMERIC(5,2),
  communication_score NUMERIC(5,2),
  leadership_score NUMERIC(5,2),
  reliability_score NUMERIC(5,2),
  initiative_score NUMERIC(5,2),
  conflict_indicator NUMERIC(5,2),
  tone_variance_score NUMERIC(5,2),
  anomaly_score NUMERIC(5,2),
  extraction_confidence NUMERIC(5,2),
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_intelligence_candidate ON public.review_intelligence(candidate_id);
CREATE INDEX IF NOT EXISTS idx_review_intelligence_review ON public.review_intelligence(review_id);

ALTER TABLE public.review_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role insert/update review_intelligence" ON public.review_intelligence;
-- No INSERT/UPDATE for anon/authenticated => service role only
DROP POLICY IF EXISTS "Admins can select review_intelligence" ON public.review_intelligence;
CREATE POLICY "Admins can select review_intelligence"
  ON public.review_intelligence FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

COMMENT ON TABLE public.review_intelligence IS 'Behavioral signals extracted from peer review text. Admin/superadmin preview only.';

-- behavioral_profile_vector: aggregated behavioral profile per candidate. Service role write; admin SELECT.
CREATE TABLE IF NOT EXISTS public.behavioral_profile_vector (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  avg_pressure NUMERIC(5,2),
  avg_structure NUMERIC(5,2),
  avg_communication NUMERIC(5,2),
  avg_leadership NUMERIC(5,2),
  avg_reliability NUMERIC(5,2),
  avg_initiative NUMERIC(5,2),
  conflict_risk_level NUMERIC(5,2),
  tone_stability NUMERIC(5,2),
  review_density_weight NUMERIC(5,2),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_profile_vector_candidate ON public.behavioral_profile_vector(candidate_id);

ALTER TABLE public.behavioral_profile_vector ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select behavioral_profile_vector" ON public.behavioral_profile_vector;
CREATE POLICY "Admins can select behavioral_profile_vector"
  ON public.behavioral_profile_vector FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

COMMENT ON TABLE public.behavioral_profile_vector IS 'Aggregated behavioral vector per candidate. Admin preview only.';

-- Feature flag: behavioral_intelligence_enterprise
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key') THEN
    INSERT INTO public.feature_flags (name, key, description, is_globally_enabled, visibility_type, required_subscription_tier, created_at, updated_at)
    SELECT 'Behavioral Intelligence Enterprise', 'behavioral_intelligence_enterprise', 'AI-extracted behavioral signals from peer reviews. Admin preview.', false, 'ui', 'emp_enterprise', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'behavioral_intelligence_enterprise');
  ELSE
    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Behavioral Intelligence Enterprise', 'AI-extracted behavioral signals from peer reviews. Admin preview.', false, 'ui', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Behavioral Intelligence Enterprise');
  END IF;
END $$;
