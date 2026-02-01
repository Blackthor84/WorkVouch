-- ============================================================================
-- EMPLOYER CANDIDATE VIEW, REHIRE LOGS, ADMIN SESSIONS
-- ============================================================================

-- rehire_logs: audit who marked rehire_eligible and when
CREATE TABLE IF NOT EXISTS public.rehire_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_record_id UUID NOT NULL REFERENCES public.employment_records(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  previous_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rehire_logs_employment_record ON public.rehire_logs(employment_record_id);
CREATE INDEX IF NOT EXISTS idx_rehire_logs_employer ON public.rehire_logs(employer_id);

ALTER TABLE public.rehire_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can view own rehire_logs" ON public.rehire_logs;
CREATE POLICY "Employers can view own rehire_logs"
  ON public.rehire_logs FOR SELECT
  USING (employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid()));

-- admin_sessions: secure impersonation (temporary session, no raw tokens)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  impersonated_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON public.admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage own admin_sessions" ON public.admin_sessions;
CREATE POLICY "Admins can manage own admin_sessions"
  ON public.admin_sessions FOR ALL
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- employer_candidate_view: what employers see (tier-gated in API; view is data only)
-- Shows: verified employment count, trust score, aggregate ratings. NO private email.
CREATE OR REPLACE VIEW public.employer_candidate_view AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.industry,
  p.city,
  p.state,
  (SELECT COUNT(*) FROM public.employment_records er WHERE er.user_id = p.id AND er.verification_status = 'verified') AS verified_employment_count,
  COALESCE(ts.score, 0) AS trust_score,
  COALESCE(ts.reference_count, 0)::INTEGER AS reference_count,
  COALESCE(ts.average_rating, 0) AS aggregate_rating,
  (SELECT COUNT(*) FROM public.employment_records er WHERE er.user_id = p.id AND er.rehire_eligible = true) AS rehire_eligible_count
FROM public.profiles p
LEFT JOIN public.trust_scores ts ON ts.user_id = p.id;

-- RLS on view: view uses underlying tables' RLS. Employers access via API with tier check (Lite=trust only, Pro=+employment, Custom=full).
COMMENT ON VIEW public.employer_candidate_view IS 'Employer-facing candidate summary. Tier access enforced in API. No email.';
