-- ============================================================================
-- FEATURE FLAGS (Hidden Features) for WorkVouch
-- ============================================================================
-- SuperAdmin: create flags, set global toggle, visibility, allow_admin_assign, assign to users/employers
-- Admin: view flags, assign to users/employers only when allow_admin_assign = true
-- ============================================================================

-- Visibility: 'ui' = visible in UI when enabled, 'api_only' = only accessible via API
CREATE TYPE feature_visibility AS ENUM ('ui', 'api_only');

-- feature_flags: defines each hidden feature
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_globally_enabled BOOLEAN NOT NULL DEFAULT false,
  visibility_type feature_visibility NOT NULL DEFAULT 'ui',
  allow_admin_assign BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON public.feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_globally_enabled ON public.feature_flags(is_globally_enabled);

-- feature_flag_assignments: per-user or per-employer enablement (when not globally enabled)
-- employer_id references employer_accounts(id); user_id references profiles(id)
CREATE TABLE IF NOT EXISTS public.feature_flag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_flag_id UUID NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT assignment_target CHECK (
    (user_id IS NOT NULL AND employer_id IS NULL) OR
    (user_id IS NULL AND employer_id IS NOT NULL)
  )
);

-- Partial unique indexes (nullable columns)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_flag_user
  ON public.feature_flag_assignments (feature_flag_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_flag_employer
  ON public.feature_flag_assignments (feature_flag_id, employer_id) WHERE employer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feature_flag_assignments_feature ON public.feature_flag_assignments(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_assignments_user ON public.feature_flag_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_assignments_employer ON public.feature_flag_assignments(employer_id);

-- updated_at trigger (reuse if exists)
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

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flag_assignments_updated_at
  BEFORE UPDATE ON public.feature_flag_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: only admins (via service role or app check) manage; reads for check are done server-side with service role
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: no direct client access; all access via API with role checks
CREATE POLICY "Feature flags: service role only"
  ON public.feature_flags FOR ALL
  USING (false);

CREATE POLICY "Feature flag assignments: service role only"
  ON public.feature_flag_assignments FOR ALL
  USING (false);

-- Seed placeholder rows for future features (optional; SuperAdmin can create via UI)
-- Uncomment to pre-create:
/*
INSERT INTO public.feature_flags (name, description, visibility_type)
VALUES
  ('rehire_probability_index', 'Rehire Probability Index', 'ui'),
  ('team_compatibility_scoring', 'Team Compatibility Scoring', 'ui'),
  ('workforce_risk_indicator', 'Workforce Risk Indicator', 'ui'),
  ('ai_reference_summaries', 'AI Reference Summaries', 'ui'),
  ('integrity_index', 'Integrity Index', 'ui')
ON CONFLICT (name) DO NOTHING;
*/
