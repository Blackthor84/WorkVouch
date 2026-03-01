-- Employer legal disclaimer acceptance. Required before accessing candidate search / profile view.
-- Idempotent: safe to run if table already exists.

CREATE TABLE IF NOT EXISTS public.employer_legal_acceptance (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, version)
);

CREATE INDEX IF NOT EXISTS idx_employer_legal_acceptance_profile_version
  ON public.employer_legal_acceptance(profile_id, version);

COMMENT ON TABLE public.employer_legal_acceptance IS 'Employer acceptance of legal disclaimer; version bumps require re-acceptance.';
