-- ============================================================================
-- SIMULATION LAB: Hybrid simulation environment for admin testing
-- Uses real tables with is_simulation flag. Never affects production.
-- Auto-purge expired simulation data. Admin/superadmin + preview only.
-- ============================================================================

-- simulation_sessions: one per lab session
CREATE TABLE IF NOT EXISTS public.simulation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_simulation_sessions_expires ON public.simulation_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_simulation_sessions_created_by ON public.simulation_sessions(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_simulation_sessions_active ON public.simulation_sessions(is_active) WHERE is_active = true;

COMMENT ON TABLE public.simulation_sessions IS 'Admin testing lab: session scoping for simulated data. Purged after expires_at.';

-- Add simulation columns to production tables (safe: IF NOT EXISTS)
-- profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_simulation ON public.profiles(simulation_session_id) WHERE is_simulation = true;
CREATE INDEX IF NOT EXISTS idx_profiles_expires ON public.profiles(expires_at) WHERE is_simulation = true AND expires_at IS NOT NULL;

-- employer_accounts
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_employer_accounts_simulation ON public.employer_accounts(simulation_session_id) WHERE is_simulation = true;

-- employment_records (for simulated employee job history)
ALTER TABLE public.employment_records
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- employment_matches (for peer review flow)
ALTER TABLE public.employment_matches
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- intelligence_snapshots
ALTER TABLE public.intelligence_snapshots
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_simulation ON public.intelligence_snapshots(simulation_session_id) WHERE is_simulation = true;

-- profile_metrics (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profile_metrics') THEN
    ALTER TABLE public.profile_metrics
      ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- team_fit_scores
ALTER TABLE public.team_fit_scores
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- risk_model_outputs
ALTER TABLE public.risk_model_outputs
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- hiring_confidence_scores
ALTER TABLE public.hiring_confidence_scores
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- network_density_index
ALTER TABLE public.network_density_index
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- employment_references (peer reviews)
ALTER TABLE public.employment_references
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- usage_logs (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_logs') THEN
    ALTER TABLE public.usage_logs
      ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- RLS: simulation_sessions — only admins (via user_roles or profiles.role) can manage
ALTER TABLE public.simulation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage simulation_sessions" ON public.simulation_sessions;
CREATE POLICY "Admins can manage simulation_sessions"
  ON public.simulation_sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role IN ('admin', 'superadmin')))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role IN ('admin', 'superadmin')))
  );

-- ============================================================================
-- PURGE: Delete all expired simulation rows (run every 5 min via pg_cron or API)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.purge_expired_simulations()
RETURNS TABLE(deleted_table text, deleted_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  cnt bigint;
  session_ids uuid[];
BEGIN
  -- Collect session IDs that are expired
  SELECT ARRAY_AGG(id) INTO session_ids
  FROM public.simulation_sessions
  WHERE expires_at < NOW();

  IF session_ids IS NULL OR array_length(session_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Deactivate sessions
  UPDATE public.simulation_sessions SET is_active = false WHERE expires_at < NOW();

  -- Delete in dependency order: references first, then snapshots/metrics, then core
  -- employment_references
  WITH d AS (DELETE FROM public.employment_references WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_references'; deleted_count := cnt; RETURN NEXT;

  -- employment_matches
  WITH d AS (DELETE FROM public.employment_matches WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_matches'; deleted_count := cnt; RETURN NEXT;

  -- employment_records
  WITH d AS (DELETE FROM public.employment_records WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_records'; deleted_count := cnt; RETURN NEXT;

  -- intelligence_snapshots
  WITH d AS (DELETE FROM public.intelligence_snapshots WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'intelligence_snapshots'; deleted_count := cnt; RETURN NEXT;

  -- profile_metrics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profile_metrics') THEN
    EXECUTE 'WITH d AS (DELETE FROM public.profile_metrics WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY($1)) RETURNING 1) SELECT count(*) FROM d' INTO cnt USING session_ids;
    deleted_table := 'profile_metrics'; deleted_count := cnt; RETURN NEXT;
  END IF;

  -- team_fit_scores, risk_model_outputs, hiring_confidence_scores, network_density_index
  WITH d AS (DELETE FROM public.team_fit_scores WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'team_fit_scores'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.risk_model_outputs WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'risk_model_outputs'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.hiring_confidence_scores WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'hiring_confidence_scores'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.network_density_index WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'network_density_index'; deleted_count := cnt; RETURN NEXT;

  -- usage_logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_logs') THEN
    EXECUTE 'WITH d AS (DELETE FROM public.usage_logs WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY($1)) RETURNING 1) SELECT count(*) FROM d' INTO cnt USING session_ids;
    deleted_table := 'usage_logs'; deleted_count := cnt; RETURN NEXT;
  END IF;

  -- employer_accounts (simulated employers; no auth FK)
  WITH d AS (DELETE FROM public.employer_accounts WHERE is_simulation = true AND (expires_at IS NOT NULL AND expires_at < NOW() OR simulation_session_id = ANY(session_ids)) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employer_accounts'; deleted_count := cnt; RETURN NEXT;

  -- profiles: do NOT delete here (profiles.id = auth.users.id). Caller must delete via auth.admin.deleteUser() then CASCADE will remove profile.
  deleted_table := 'profiles'; deleted_count := 0; RETURN NEXT;

  -- Finally delete session rows
  WITH d AS (DELETE FROM public.simulation_sessions WHERE expires_at < NOW() RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'simulation_sessions'; deleted_count := cnt; RETURN NEXT;

  RETURN;
END;
$$;

-- Returns profile IDs that are simulation and expired (caller must delete via Supabase Auth Admin API, then profile CASCADE deletes).
CREATE OR REPLACE FUNCTION public.get_expired_simulation_profile_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles
  WHERE is_simulation = true
  AND (expires_at IS NOT NULL AND expires_at < NOW()
       OR simulation_session_id IN (SELECT id FROM public.simulation_sessions WHERE expires_at < NOW()));
$$;
COMMENT ON FUNCTION public.get_expired_simulation_profile_ids() IS 'Returns profile IDs to purge; caller must auth.admin.deleteUser(id) for each.';

COMMENT ON FUNCTION public.purge_expired_simulations() IS 'Removes all simulation data where is_simulation=true and expires_at < NOW(). Schedule: pg_cron every 5 min or external cron POST /api/admin/simulation-lab/purge every 5 min.';
