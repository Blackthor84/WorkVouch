-- ============================================================================
-- Sandbox Stress Mode: mode flag, baseline snapshots, cleanup extension.
-- Admin/SuperAdmin only. No production impact.
-- ============================================================================

-- Add mode to sandbox_sessions: 'standard' | 'stress'
ALTER TABLE public.sandbox_sessions
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'standard'
  CHECK (mode IN ('standard', 'stress'));

COMMENT ON COLUMN public.sandbox_sessions.mode IS 'standard = normal volume; stress = high-volume generation up to 10k.';

-- sandbox_baseline_snapshots: baseline before/after stress, delta for drift detection
CREATE TABLE IF NOT EXISTS public.sandbox_baseline_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_session_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  baseline_before JSONB NOT NULL,
  baseline_after JSONB NOT NULL,
  delta_percent JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_sandbox_baseline_snapshots_session ON public.sandbox_baseline_snapshots(sandbox_session_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_baseline_snapshots_expires ON public.sandbox_baseline_snapshots(expires_at);

ALTER TABLE public.sandbox_baseline_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins select sandbox_baseline_snapshots"
  ON public.sandbox_baseline_snapshots FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

COMMENT ON TABLE public.sandbox_baseline_snapshots IS 'Before/after baseline and delta for stress mode drift detection.';

-- Extend cleanup to include sandbox_baseline_snapshots
CREATE OR REPLACE FUNCTION public.cleanup_expired_sandbox_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sandbox_baseline_snapshots WHERE expires_at < NOW();
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
