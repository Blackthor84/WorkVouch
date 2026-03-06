-- ============================================================================
-- Trust Policies: employer-defined "Trusted Hire Archetypes" by trust metrics
-- Not a job board; evaluates candidates against trust signals only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trust_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  min_trust_score INTEGER NOT NULL DEFAULT 0,
  min_verification_coverage INTEGER NOT NULL DEFAULT 0,
  required_reference_type TEXT,
  min_trust_graph_depth TEXT,
  allow_recent_disputes BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_policies_employer_id ON public.trust_policies(employer_id);

COMMENT ON TABLE public.trust_policies IS 'Employer-defined trust archetypes: min trust score, verification coverage, reference type, graph depth, dispute tolerance. Used to evaluate candidates, not as job listings.';
COMMENT ON COLUMN public.trust_policies.min_trust_graph_depth IS 'Minimum depth band: weak, moderate, strong (weak < moderate < strong).';
COMMENT ON COLUMN public.trust_policies.required_reference_type IS 'If set: manager (supervisor), coworker, or client. Candidate must have at least one reference of this type.';

ALTER TABLE public.trust_policies ENABLE ROW LEVEL SECURITY;

-- Employers can manage their own policies (employer_id = their profile id = auth.uid() when 1:1 profile)
DROP POLICY IF EXISTS "Employers can view own trust policies" ON public.trust_policies;
CREATE POLICY "Employers can view own trust policies"
  ON public.trust_policies FOR SELECT
  USING (employer_id = auth.uid());

DROP POLICY IF EXISTS "Employers can insert own trust policies" ON public.trust_policies;
CREATE POLICY "Employers can insert own trust policies"
  ON public.trust_policies FOR INSERT
  WITH CHECK (employer_id = auth.uid());

DROP POLICY IF EXISTS "Employers can update own trust policies" ON public.trust_policies;
CREATE POLICY "Employers can update own trust policies"
  ON public.trust_policies FOR UPDATE
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

DROP POLICY IF EXISTS "Employers can delete own trust policies" ON public.trust_policies;
CREATE POLICY "Employers can delete own trust policies"
  ON public.trust_policies FOR DELETE
  USING (employer_id = auth.uid());

-- Service role can read/write for API (server-side evaluation)
-- APIs use getSupabaseServer() which runs as service role when needed; for RLS we rely on auth.uid() = employer profile id
