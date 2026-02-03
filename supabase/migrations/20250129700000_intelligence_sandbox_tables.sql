-- ============================================================================
-- Enterprise Intelligence Sandbox: Admin/SuperAdmin only. Isolated test data.
-- All tables prefixed sandbox_. Auto-expire 10 min. Never affects production.
-- ============================================================================

-- sandbox_sessions: one per simulation run.
CREATE TABLE IF NOT EXISTS public.sandbox_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_admin UUID NOT NULL,
  industry TEXT NOT NULL,
  sub_industry TEXT,
  role_title TEXT,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  candidate_count INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_expires ON public.sandbox_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_created_by ON public.sandbox_sessions(created_by_admin);

-- sandbox_profiles: fake candidates for simulation (no auth.users reference).
CREATE TABLE IF NOT EXISTS public.sandbox_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  created_by_admin UUID NOT NULL,
  industry TEXT NOT NULL,
  sub_industry TEXT,
  role_title TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_profiles_session ON public.sandbox_profiles(sandbox_session_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_profiles_expires ON public.sandbox_profiles(expires_at);

-- sandbox_behavioral_profile_vector: mirror behavioral_profile_vector; references sandbox_profiles.
CREATE TABLE IF NOT EXISTS public.sandbox_behavioral_profile_vector (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.sandbox_profiles(id) ON DELETE CASCADE,
  avg_pressure NUMERIC(5,2),
  avg_structure NUMERIC(5,2),
  avg_communication NUMERIC(5,2),
  avg_leadership NUMERIC(5,2),
  avg_reliability NUMERIC(5,2),
  avg_initiative NUMERIC(5,2),
  conflict_risk_level NUMERIC(5,2),
  tone_stability NUMERIC(5,2),
  review_density_weight NUMERIC(5,2),
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_bpv_profile ON public.sandbox_behavioral_profile_vector(profile_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_bpv_expires ON public.sandbox_behavioral_profile_vector(expires_at);

-- sandbox_industry_baselines: mirror industry_behavioral_baselines; per-session.
CREATE TABLE IF NOT EXISTS public.sandbox_industry_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
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
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_industry_session ON public.sandbox_industry_baselines(sandbox_session_id);

-- sandbox_sub_industry_baselines: same shape; sub_industry key.
CREATE TABLE IF NOT EXISTS public.sandbox_sub_industry_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  sub_industry TEXT NOT NULL,
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
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_sub_industry_session ON public.sandbox_sub_industry_baselines(sandbox_session_id);

-- sandbox_role_baselines: same shape; role key.
CREATE TABLE IF NOT EXISTS public.sandbox_role_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
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
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_role_session ON public.sandbox_role_baselines(sandbox_session_id);

-- sandbox_employer_baselines: mirror employer_behavioral_baselines; per-session (employer_id optional for sandbox employer).
CREATE TABLE IF NOT EXISTS public.sandbox_employer_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  avg_pressure NUMERIC(5,2),
  avg_structure NUMERIC(5,2),
  avg_communication NUMERIC(5,2),
  avg_leadership NUMERIC(5,2),
  avg_reliability NUMERIC(5,2),
  avg_initiative NUMERIC(5,2),
  avg_conflict_risk NUMERIC(5,2),
  avg_tone_stability NUMERIC(5,2),
  employee_sample_size INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_employer_session ON public.sandbox_employer_baselines(sandbox_session_id);

-- Sandbox output tables: store team_fit, risk, hiring_confidence for sandbox only (never production).
CREATE TABLE IF NOT EXISTS public.sandbox_team_fit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.sandbox_profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  alignment_score NUMERIC(5,2) NOT NULL,
  breakdown JSONB,
  model_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sandbox_risk_model_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.sandbox_profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  overall_score NUMERIC(5,2) NOT NULL,
  breakdown JSONB,
  model_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sandbox_hiring_confidence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.sandbox_profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  composite_score NUMERIC(5,2) NOT NULL,
  breakdown JSONB,
  model_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: admin/superadmin only. No access for normal users.
ALTER TABLE public.sandbox_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_behavioral_profile_vector ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_industry_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_sub_industry_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_role_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_employer_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_team_fit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_risk_model_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_hiring_confidence_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins select sandbox_sessions"
  ON public.sandbox_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_profiles"
  ON public.sandbox_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_behavioral_profile_vector"
  ON public.sandbox_behavioral_profile_vector FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_industry_baselines"
  ON public.sandbox_industry_baselines FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_sub_industry_baselines"
  ON public.sandbox_sub_industry_baselines FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_role_baselines"
  ON public.sandbox_role_baselines FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_employer_baselines"
  ON public.sandbox_employer_baselines FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_team_fit_scores"
  ON public.sandbox_team_fit_scores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_risk_model_outputs"
  ON public.sandbox_risk_model_outputs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins select sandbox_hiring_confidence_scores"
  ON public.sandbox_hiring_confidence_scores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Cleanup: delete expired sandbox rows. Call from pg_cron every 5 min or from API before sandbox ops.
CREATE OR REPLACE FUNCTION public.cleanup_expired_sandbox_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sandbox_hiring_confidence_scores WHERE expires_at < NOW();
  DELETE FROM public.sandbox_risk_model_outputs WHERE expires_at < NOW();
  DELETE FROM public.sandbox_team_fit_scores WHERE expires_at < NOW();
  DELETE FROM public.sandbox_employer_baselines WHERE expires_at < NOW();
  DELETE FROM public.sandbox_role_baselines WHERE expires_at < NOW();
  DELETE FROM public.sandbox_sub_industry_baselines WHERE expires_at < NOW();
  DELETE FROM public.sandbox_industry_baselines WHERE expires_at < NOW();
  DELETE FROM public.sandbox_behavioral_profile_vector WHERE expires_at < NOW();
  DELETE FROM public.sandbox_profiles WHERE expires_at < NOW();
  DELETE FROM public.sandbox_sessions WHERE expires_at < NOW();
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_sandbox_data() IS 'Removes expired sandbox rows. Run via pg_cron every 5 min or from sandbox API.';

-- Feature flag: intelligence_sandbox (Admin/SuperAdmin bypass in app)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key') THEN
      INSERT INTO public.feature_flags (name, key, description, is_globally_enabled, visibility_type, required_subscription_tier, created_at, updated_at)
      SELECT 'Intelligence Sandbox', 'intelligence_sandbox', 'Admin-only simulation of behavioral baselines and scoring. Data expires in 10 min.', false, 'ui', NULL, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'intelligence_sandbox');
    END IF;
  END IF;
END $$;
