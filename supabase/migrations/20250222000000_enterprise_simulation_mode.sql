-- ============================================================================
-- ENTERPRISE SIMULATION MODE
-- Additive only. Simulation data is isolated and auto-cleanable.
-- ============================================================================

-- organizations.is_simulation: marks org as simulation-only; cleanup only when true
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.is_simulation IS 'When true, org and linked data are for load/testing only. Safe to delete via cleanupEnterpriseSimulation().';

CREATE INDEX IF NOT EXISTS idx_organizations_is_simulation ON public.organizations(is_simulation) WHERE is_simulation = true;

-- Link simulation org to session for cleanup of session-scoped candidate data
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS simulation_session_id UUID REFERENCES public.simulation_sessions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.organizations.simulation_session_id IS 'When is_simulation=true, optional link to simulation_sessions for purging candidate/review data.';

-- ============================================================================
-- CLEANUP: Delete all simulation data for an org (only when is_simulation = true)
-- Session-scoped data (profiles, employment_*, intelligence_*) deleted by session.
-- Caller must purge auth users for profile IDs returned by get_expired_simulation_profile_ids or similar.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_enterprise_simulation(p_org_id UUID)
RETURNS TABLE(step text, deleted_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_sim boolean;
  v_session_id uuid;
  cnt bigint;
BEGIN
  SELECT is_simulation, simulation_session_id INTO v_is_sim, v_session_id
  FROM public.organizations
  WHERE id = p_org_id;

  IF NOT FOUND OR NOT v_is_sim THEN
    RAISE EXCEPTION 'cleanup_enterprise_simulation: org % not found or not a simulation org', p_org_id;
  END IF;

  -- organization_usage
  WITH d AS (DELETE FROM public.organization_usage WHERE organization_id = p_org_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  step := 'organization_usage'; deleted_count := cnt; RETURN NEXT;

  -- enterprise_signals
  WITH d AS (DELETE FROM public.enterprise_signals WHERE organization_id = p_org_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  step := 'enterprise_signals'; deleted_count := cnt; RETURN NEXT;

  -- organization_features
  WITH d AS (DELETE FROM public.organization_features WHERE organization_id = p_org_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  step := 'organization_features'; deleted_count := cnt; RETURN NEXT;

  -- organization_intelligence (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_intelligence') THEN
    EXECUTE 'WITH d AS (DELETE FROM public.organization_intelligence WHERE organization_id = $1 RETURNING 1) SELECT count(*) FROM d' INTO cnt USING p_org_id;
    step := 'organization_intelligence'; deleted_count := cnt; RETURN NEXT;
  END IF;

  -- employer_users (references profiles; do not delete profiles here)
  WITH d AS (DELETE FROM public.employer_users WHERE organization_id = p_org_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  step := 'employer_users'; deleted_count := cnt; RETURN NEXT;

  -- locations (cascade may remove departments etc.)
  WITH d AS (DELETE FROM public.locations WHERE organization_id = p_org_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  step := 'locations'; deleted_count := cnt; RETURN NEXT;

  -- employer_accounts linked to this org (simulation only)
  WITH d AS (DELETE FROM public.employer_accounts WHERE organization_id = p_org_id AND is_simulation = true RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  step := 'employer_accounts'; deleted_count := cnt; RETURN NEXT;

  -- Session-scoped candidate data (if org had a session)
  IF v_session_id IS NOT NULL THEN
    WITH d AS (DELETE FROM public.employment_references WHERE is_simulation = true AND simulation_session_id = v_session_id RETURNING 1)
    SELECT count(*) INTO cnt FROM d;
    step := 'employment_references'; deleted_count := cnt; RETURN NEXT;
    WITH d AS (DELETE FROM public.employment_matches WHERE is_simulation = true AND simulation_session_id = v_session_id RETURNING 1)
    SELECT count(*) INTO cnt FROM d;
    step := 'employment_matches'; deleted_count := cnt; RETURN NEXT;
    WITH d AS (DELETE FROM public.employment_records WHERE is_simulation = true AND simulation_session_id = v_session_id RETURNING 1)
    SELECT count(*) INTO cnt FROM d;
    step := 'employment_records'; deleted_count := cnt; RETURN NEXT;
    WITH d AS (DELETE FROM public.intelligence_snapshots WHERE is_simulation = true AND simulation_session_id = v_session_id RETURNING 1)
    SELECT count(*) INTO cnt FROM d;
    step := 'intelligence_snapshots'; deleted_count := cnt; RETURN NEXT;
    -- profiles: do not delete (auth); caller uses get_simulation_profile_ids_for_session to delete via auth.admin
  END IF;

  -- organization
  WITH d AS (DELETE FROM public.organizations WHERE id = p_org_id RETURNING 1)
  SELECT count(*) INTO cnt FROM d;
  step := 'organizations'; deleted_count := cnt; RETURN NEXT;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.cleanup_enterprise_simulation(UUID) IS 'Deletes simulation org and org-scoped data. Safe only when organizations.is_simulation = true. Session-scoped candidate data deleted when simulation_session_id set. Caller must delete auth users for profiles in that session.';

-- Helper: return profile IDs for a simulation session (for auth.admin.deleteUser)
CREATE OR REPLACE FUNCTION public.get_simulation_profile_ids_for_session(p_session_id UUID)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles
  WHERE is_simulation = true AND simulation_session_id = p_session_id;
$$;
COMMENT ON FUNCTION public.get_simulation_profile_ids_for_session(UUID) IS 'Profile IDs in a simulation session; caller must auth.admin.deleteUser(id) for each.';
