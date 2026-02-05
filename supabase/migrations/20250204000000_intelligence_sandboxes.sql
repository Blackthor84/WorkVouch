-- ============================================================================
-- INTELLIGENCE SANDBOXES — Enterprise simulation layer
-- Fully isolated from production. All sandbox rows tagged with sandbox_id.
-- Production rows have sandbox_id IS NULL. No production data touched.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intelligence_sandboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  auto_delete BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_sandboxes_created_by ON public.intelligence_sandboxes(created_by);
CREATE INDEX IF NOT EXISTS idx_intelligence_sandboxes_ends_at ON public.intelligence_sandboxes(ends_at);
CREATE INDEX IF NOT EXISTS idx_intelligence_sandboxes_status ON public.intelligence_sandboxes(status);

COMMENT ON TABLE public.intelligence_sandboxes IS 'Enterprise simulation sandboxes. Isolated from production.';

-- sandbox_id on all sandbox-scoped tables (nullable; NULL = production)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;
ALTER TABLE public.employment_records
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;
ALTER TABLE public.employment_references
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;
ALTER TABLE public.intelligence_snapshots
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;
ALTER TABLE public.team_fit_scores
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;
ALTER TABLE public.risk_model_outputs
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;
ALTER TABLE public.network_density_index
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;
ALTER TABLE public.hiring_confidence_scores
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;

-- employment_matches for peer review flow
ALTER TABLE public.employment_matches
  ADD COLUMN IF NOT EXISTS sandbox_id UUID REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_sandbox_id ON public.profiles(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employer_accounts_sandbox_id ON public.employer_accounts(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employment_records_sandbox_id ON public.employment_records(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employment_references_sandbox_id ON public.employment_references(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_sandbox_id ON public.intelligence_snapshots(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_fit_scores_sandbox_id ON public.team_fit_scores(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_model_outputs_sandbox_id ON public.risk_model_outputs(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_network_density_index_sandbox_id ON public.network_density_index(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hiring_confidence_scores_sandbox_id ON public.hiring_confidence_scores(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employment_matches_sandbox_id ON public.employment_matches(sandbox_id) WHERE sandbox_id IS NOT NULL;

-- RLS: intelligence_sandboxes — visible only to created_by or admin/superadmin
ALTER TABLE public.intelligence_sandboxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sandbox visible to creator or admin" ON public.intelligence_sandboxes;
CREATE POLICY "Sandbox visible to creator or admin"
  ON public.intelligence_sandboxes FOR ALL
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- SANDBOX AD CAMPAIGNS (Phase 4)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sandbox_ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.intelligence_sandboxes(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('cpc', 'cpm', 'sponsorship')),
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_ad_campaigns_sandbox_id ON public.sandbox_ad_campaigns(sandbox_id);

ALTER TABLE public.sandbox_ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sandbox ad campaigns visible to sandbox creator or admin" ON public.sandbox_ad_campaigns;
CREATE POLICY "Sandbox ad campaigns visible to sandbox creator or admin"
  ON public.sandbox_ad_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.intelligence_sandboxes s WHERE s.id = sandbox_id AND (s.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.intelligence_sandboxes s WHERE s.id = sandbox_id AND s.created_by = auth.uid())
  );

-- ============================================================================
-- CLEANUP: delete expired sandbox data (Phase 6)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_intelligence_sandboxes()
RETURNS TABLE(sandbox_id uuid, deleted_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
  cnt bigint;
BEGIN
  FOR s IN
    SELECT id FROM public.intelligence_sandboxes
    WHERE status = 'active' AND ends_at < NOW()
  LOOP
    -- Mark expired
    UPDATE public.intelligence_sandboxes SET status = 'expired' WHERE id = s.id;

    -- Delete in dependency order
    WITH d AS (DELETE FROM public.employment_references WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.employment_matches WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.employment_records WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.intelligence_snapshots WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.team_fit_scores WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.risk_model_outputs WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.network_density_index WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.hiring_confidence_scores WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.sandbox_ad_campaigns WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    WITH d AS (DELETE FROM public.employer_accounts WHERE sandbox_id = s.id RETURNING 1) SELECT count(*) INTO cnt FROM d;
    sandbox_id := s.id; deleted_count := cnt; RETURN NEXT;

    -- Profiles: sandbox_id set NULL so we don't delete auth users; optionally delete auth users in app
    UPDATE public.profiles SET sandbox_id = NULL WHERE sandbox_id = s.id;
  END LOOP;
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_intelligence_sandboxes() IS 'Marks expired sandboxes and deletes their data. Call from /api/admin/intelligence-sandbox/cleanup.';
