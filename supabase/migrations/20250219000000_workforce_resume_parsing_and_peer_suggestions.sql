-- ============================================================================
-- Workforce: Resume parsing status + peer match suggestions (overlap detection)
-- Same logic in sandbox and production. No mock fallback.
-- ============================================================================

-- Add parsing status and error to workforce_resumes (extraction/parse can fail)
ALTER TABLE public.workforce_resumes
  ADD COLUMN IF NOT EXISTS parsing_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS parsing_error TEXT;

COMMENT ON COLUMN public.workforce_resumes.parsing_status IS 'pending | extracting | parsing | completed | failed';
COMMENT ON COLUMN public.workforce_resumes.parsing_error IS 'Error message when parsing fails; logged in both sandbox and production.';

-- peer_match_suggestions: suggested coworker overlaps (company + date range)
CREATE TABLE IF NOT EXISTS public.peer_match_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.workforce_employees(id) ON DELETE CASCADE,
  suggested_employee_id UUID NOT NULL REFERENCES public.workforce_employees(id) ON DELETE CASCADE,
  company_normalized TEXT NOT NULL,
  overlap_start DATE NOT NULL,
  overlap_end DATE NOT NULL,
  source_resume_id UUID REFERENCES public.workforce_resumes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  environment app_environment_enum NOT NULL DEFAULT 'production',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_suggestion CHECK (employee_id != suggested_employee_id),
  UNIQUE(employee_id, suggested_employee_id, company_normalized)
);

CREATE INDEX IF NOT EXISTS idx_peer_match_suggestions_org ON public.peer_match_suggestions(organization_id);
CREATE INDEX IF NOT EXISTS idx_peer_match_suggestions_employee ON public.peer_match_suggestions(employee_id);
CREATE INDEX IF NOT EXISTS idx_peer_match_suggestions_environment ON public.peer_match_suggestions(environment);

COMMENT ON TABLE public.peer_match_suggestions IS 'Suggested peer connections from resume overlap (company + dates). Same algorithm in sandbox and production.';

DROP TRIGGER IF EXISTS set_peer_match_suggestions_updated_at ON public.peer_match_suggestions;
CREATE TRIGGER set_peer_match_suggestions_updated_at
  BEFORE UPDATE ON public.peer_match_suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.peer_match_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "peer_match_suggestions_enterprise" ON public.peer_match_suggestions;
CREATE POLICY "peer_match_suggestions_enterprise"
  ON public.peer_match_suggestions FOR ALL
  USING (organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.current_user_enterprise_org_ids()));

DROP POLICY IF EXISTS "peer_match_suggestions_location" ON public.peer_match_suggestions;
CREATE POLICY "peer_match_suggestions_location"
  ON public.peer_match_suggestions FOR ALL
  USING (
    employee_id IN (SELECT id FROM public.workforce_employees WHERE location_id IN (SELECT public.current_user_location_ids()))
    OR suggested_employee_id IN (SELECT id FROM public.workforce_employees WHERE location_id IN (SELECT public.current_user_location_ids()))
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "peer_match_suggestions_employee_self" ON public.peer_match_suggestions;
CREATE POLICY "peer_match_suggestions_employee_self"
  ON public.peer_match_suggestions FOR SELECT
  USING (
    employee_id IN (SELECT id FROM public.workforce_employees WHERE profile_id = auth.uid())
    OR suggested_employee_id IN (SELECT id FROM public.workforce_employees WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "peer_match_suggestions_superadmin" ON public.peer_match_suggestions;
CREATE POLICY "peer_match_suggestions_superadmin"
  ON public.peer_match_suggestions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );
