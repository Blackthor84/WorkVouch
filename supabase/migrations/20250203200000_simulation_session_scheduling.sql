-- ============================================================================
-- SIMULATION SESSION SCHEDULING
-- Start/end datetime, auto-delete toggle, status (scheduled|running|expired|deleted).
-- Cron purges expired sessions (auto_delete=true). Manual kill sets status=deleted and purges.
-- Hard isolation: all simulation data tagged with simulation_session_id; purge removes everything.
-- ============================================================================

-- Add scheduling columns to simulation_sessions (nullable first for backfill, then set NOT NULL)
ALTER TABLE public.simulation_sessions
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_delete BOOLEAN,
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Backfill: existing rows get start_at = created_at, auto_delete = true, status from time
UPDATE public.simulation_sessions
SET
  start_at = COALESCE(start_at, created_at),
  auto_delete = COALESCE(auto_delete, true),
  status = CASE
    WHEN status IS NOT NULL THEN status
    WHEN expires_at < NOW() THEN 'expired'
    WHEN COALESCE(start_at, created_at) > NOW() THEN 'scheduled'
    ELSE 'running'
  END
WHERE start_at IS NULL OR auto_delete IS NULL OR status IS NULL;

-- Enforce NOT NULL and CHECK
ALTER TABLE public.simulation_sessions
  ALTER COLUMN start_at SET DEFAULT NOW(),
  ALTER COLUMN start_at SET NOT NULL;

ALTER TABLE public.simulation_sessions
  ALTER COLUMN auto_delete SET DEFAULT true,
  ALTER COLUMN auto_delete SET NOT NULL;

ALTER TABLE public.simulation_sessions
  ALTER COLUMN status SET DEFAULT 'running';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'simulation_sessions_status_check'
  ) THEN
    ALTER TABLE public.simulation_sessions
      ADD CONSTRAINT simulation_sessions_status_check
      CHECK (status IN ('scheduled', 'running', 'expired', 'deleted'));
  END IF;
END $$;

ALTER TABLE public.simulation_sessions
  ALTER COLUMN status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_simulation_sessions_start_at ON public.simulation_sessions(start_at);
CREATE INDEX IF NOT EXISTS idx_simulation_sessions_status ON public.simulation_sessions(status);

COMMENT ON COLUMN public.simulation_sessions.start_at IS 'When session becomes active (running).';
COMMENT ON COLUMN public.simulation_sessions.expires_at IS 'End datetime; after this session is expired.';
COMMENT ON COLUMN public.simulation_sessions.auto_delete IS 'When true, cron will purge this session data when expired.';
COMMENT ON COLUMN public.simulation_sessions.status IS 'scheduled | running | expired | deleted';

-- ============================================================================
-- Status transition helper: call from app or cron to keep status in sync
-- ============================================================================
CREATE OR REPLACE FUNCTION public.simulation_session_transition_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- scheduled -> running when start_at <= now()
  UPDATE public.simulation_sessions
  SET status = 'running'
  WHERE status = 'scheduled' AND start_at <= NOW();

  -- running -> expired when expires_at < now()
  UPDATE public.simulation_sessions
  SET status = 'expired', is_active = false
  WHERE status = 'running' AND expires_at < NOW();

  -- scheduled -> expired if start_at and expires_at both past
  UPDATE public.simulation_sessions
  SET status = 'expired', is_active = false
  WHERE status = 'scheduled' AND expires_at < NOW();
END;
$$;

-- ============================================================================
-- Purge: only sessions that are (expired AND auto_delete) OR deleted.
-- Includes unified_intelligence_scores and data_density_snapshots.
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
  now_ts timestamptz := NOW();
BEGIN
  -- Keep status in sync
  PERFORM public.simulation_session_transition_status();

  -- Sessions to purge: expired with auto_delete, or status = deleted
  SELECT ARRAY_AGG(id) INTO session_ids
  FROM public.simulation_sessions
  WHERE (status = 'expired' AND auto_delete = true)
     OR status = 'deleted';

  IF session_ids IS NULL OR array_length(session_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- employment_references
  WITH d AS (DELETE FROM public.employment_references WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_references'; deleted_count := cnt; RETURN NEXT;

  -- employment_matches
  WITH d AS (DELETE FROM public.employment_matches WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_matches'; deleted_count := cnt; RETURN NEXT;

  -- employment_records
  WITH d AS (DELETE FROM public.employment_records WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_records'; deleted_count := cnt; RETURN NEXT;

  -- intelligence_snapshots
  WITH d AS (DELETE FROM public.intelligence_snapshots WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'intelligence_snapshots'; deleted_count := cnt; RETURN NEXT;

  -- unified_intelligence_scores
  WITH d AS (DELETE FROM public.unified_intelligence_scores WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'unified_intelligence_scores'; deleted_count := cnt; RETURN NEXT;

  -- data_density_snapshots
  WITH d AS (DELETE FROM public.data_density_snapshots WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'data_density_snapshots'; deleted_count := cnt; RETURN NEXT;

  -- profile_metrics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profile_metrics') THEN
    EXECUTE 'WITH d AS (DELETE FROM public.profile_metrics WHERE is_simulation = true AND simulation_session_id = ANY($1) RETURNING 1) SELECT count(*) FROM d' INTO cnt USING session_ids;
    deleted_table := 'profile_metrics'; deleted_count := cnt; RETURN NEXT;
  END IF;

  -- team_fit_scores, risk_model_outputs, hiring_confidence_scores, network_density_index
  WITH d AS (DELETE FROM public.team_fit_scores WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'team_fit_scores'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.risk_model_outputs WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'risk_model_outputs'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.hiring_confidence_scores WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'hiring_confidence_scores'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.network_density_index WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'network_density_index'; deleted_count := cnt; RETURN NEXT;

  -- usage_logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_logs') THEN
    EXECUTE 'WITH d AS (DELETE FROM public.usage_logs WHERE is_simulation = true AND simulation_session_id = ANY($1) RETURNING 1) SELECT count(*) FROM d' INTO cnt USING session_ids;
    deleted_table := 'usage_logs'; deleted_count := cnt; RETURN NEXT;
  END IF;

  -- employer_accounts
  WITH d AS (DELETE FROM public.employer_accounts WHERE is_simulation = true AND simulation_session_id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employer_accounts'; deleted_count := cnt; RETURN NEXT;

  deleted_table := 'profiles'; deleted_count := 0; RETURN NEXT;

  -- Delete session rows and return count
  WITH d AS (DELETE FROM public.simulation_sessions WHERE id = ANY(session_ids) RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'simulation_sessions'; deleted_count := cnt; RETURN NEXT;

  RETURN;
END;
$$;

-- get_expired_simulation_profile_ids: only for sessions we are purging (expired+auto_delete or deleted)
CREATE OR REPLACE FUNCTION public.get_expired_simulation_profile_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id FROM public.profiles p
  WHERE p.is_simulation = true
  AND p.simulation_session_id IN (
    SELECT id FROM public.simulation_sessions
    WHERE (status = 'expired' AND auto_delete = true) OR status = 'deleted'
  );
$$;

-- Purge a single session by id (manual kill). Marks status=deleted then purges that session's data.
CREATE OR REPLACE FUNCTION public.purge_simulation_session(p_session_id uuid)
RETURNS TABLE(deleted_table text, deleted_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt bigint;
  session_ids uuid[] := ARRAY[p_session_id];
BEGIN
  -- Mark as deleted so it's included in purge logic
  UPDATE public.simulation_sessions SET status = 'deleted', is_active = false WHERE id = p_session_id;

  -- employment_references through employer_accounts (same order as purge_expired_simulations)
  WITH d AS (DELETE FROM public.employment_references WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_references'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.employment_matches WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_matches'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.employment_records WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employment_records'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.intelligence_snapshots WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'intelligence_snapshots'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.unified_intelligence_scores WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'unified_intelligence_scores'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.data_density_snapshots WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'data_density_snapshots'; deleted_count := cnt; RETURN NEXT;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profile_metrics') THEN
    EXECUTE 'WITH d AS (DELETE FROM public.profile_metrics WHERE is_simulation = true AND simulation_session_id = $1 RETURNING 1) SELECT count(*) FROM d' INTO cnt USING p_session_id;
    deleted_table := 'profile_metrics'; deleted_count := cnt; RETURN NEXT;
  END IF;

  WITH d AS (DELETE FROM public.team_fit_scores WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'team_fit_scores'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.risk_model_outputs WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'risk_model_outputs'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.hiring_confidence_scores WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'hiring_confidence_scores'; deleted_count := cnt; RETURN NEXT;

  WITH d AS (DELETE FROM public.network_density_index WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'network_density_index'; deleted_count := cnt; RETURN NEXT;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_logs') THEN
    EXECUTE 'WITH d AS (DELETE FROM public.usage_logs WHERE is_simulation = true AND simulation_session_id = $1 RETURNING 1) SELECT count(*) FROM d' INTO cnt USING p_session_id;
    deleted_table := 'usage_logs'; deleted_count := cnt; RETURN NEXT;
  END IF;

  WITH d AS (DELETE FROM public.employer_accounts WHERE is_simulation = true AND simulation_session_id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'employer_accounts'; deleted_count := cnt; RETURN NEXT;

  deleted_table := 'profiles'; deleted_count := 0; RETURN NEXT;

  WITH d AS (DELETE FROM public.simulation_sessions WHERE id = p_session_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  deleted_table := 'simulation_sessions'; deleted_count := cnt; RETURN NEXT;

  RETURN;
END;
$$;

-- Returns profile IDs for a single session (for manual kill: delete auth users after purge_simulation_session).
CREATE OR REPLACE FUNCTION public.get_simulation_profile_ids_by_session(p_session_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles
  WHERE is_simulation = true AND simulation_session_id = p_session_id;
$$;

COMMENT ON FUNCTION public.purge_simulation_session(uuid) IS 'Manual kill: purge one session and its data. Then call get_simulation_profile_ids_by_session and auth.admin.deleteUser for each.';
COMMENT ON FUNCTION public.purge_expired_simulations() IS 'Cron: transition status, then purge sessions where (expired AND auto_delete) or deleted. Call get_expired_simulation_profile_ids BEFORE this to get auth user IDs to delete.';
