-- ============================================================================
-- verification_invites: coworker verification invite records (token-based link).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.verification_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_invites_token ON public.verification_invites(token);
CREATE INDEX IF NOT EXISTS idx_verification_invites_candidate ON public.verification_invites(candidate_id);
CREATE INDEX IF NOT EXISTS idx_verification_invites_status ON public.verification_invites(status);

COMMENT ON TABLE public.verification_invites IS 'Coworker verification invites; token used in /verify/[token] link.';

ALTER TABLE public.verification_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access verification_invites" ON public.verification_invites;
CREATE POLICY "Service role full access verification_invites"
  ON public.verification_invites FOR ALL TO service_role USING (true) WITH CHECK (true);
