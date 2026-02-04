-- ============================================================================
-- UNIFIED INTELLIGENCE SCORE TABLE + DATA DENSITY TRACKER
-- Canonical single table for unified scores; data density snapshots for analytics.
-- ============================================================================

-- unified_intelligence_scores: canonical aggregate per user (and optional employer).
-- Populated by unified intelligence pipeline. One row per user_id, optional employer_id.
CREATE TABLE IF NOT EXISTS public.unified_intelligence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  profile_strength NUMERIC(5,2) NOT NULL DEFAULT 0,
  career_health_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  stability_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  reference_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rehire_probability NUMERIC(5,2) NOT NULL DEFAULT 0,
  dispute_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  network_density_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  fraud_confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall_risk_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  hiring_confidence_score NUMERIC(5,2),
  team_fit_score NUMERIC(5,2),
  model_version TEXT NOT NULL DEFAULT 'v1.0-enterprise',
  is_simulation BOOLEAN NOT NULL DEFAULT false,
  simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_unified_intelligence_scores_user ON public.unified_intelligence_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_intelligence_scores_employer ON public.unified_intelligence_scores(employer_id);
CREATE INDEX IF NOT EXISTS idx_unified_intelligence_scores_simulation ON public.unified_intelligence_scores(simulation_session_id) WHERE is_simulation = true;

COMMENT ON TABLE public.unified_intelligence_scores IS 'Canonical unified intelligence scores per user (optional employer context).';

-- data_density_snapshots: track profiles, employment_records, references, intelligence rows.
-- Scope: global, session (simulation_session_id), or employer.
CREATE TABLE IF NOT EXISTS public.data_density_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'session', 'employer')),
  scope_id TEXT,
  profiles_count INTEGER NOT NULL DEFAULT 0,
  employment_records_count INTEGER NOT NULL DEFAULT 0,
  references_count INTEGER NOT NULL DEFAULT 0,
  intelligence_rows_count INTEGER NOT NULL DEFAULT 0,
  is_simulation BOOLEAN NOT NULL DEFAULT false,
  simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_density_snapshots_scope ON public.data_density_snapshots(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_data_density_snapshots_snapshot_at ON public.data_density_snapshots(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_density_snapshots_simulation ON public.data_density_snapshots(simulation_session_id) WHERE is_simulation = true;

COMMENT ON TABLE public.data_density_snapshots IS 'Data density metrics for analytics and investor sandbox.';

-- RLS: admin-only for both tables
ALTER TABLE public.unified_intelligence_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_density_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage unified_intelligence_scores" ON public.unified_intelligence_scores;
CREATE POLICY "Admins manage unified_intelligence_scores"
  ON public.unified_intelligence_scores FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Admins manage data_density_snapshots" ON public.data_density_snapshots;
CREATE POLICY "Admins manage data_density_snapshots"
  ON public.data_density_snapshots FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
