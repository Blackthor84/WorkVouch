-- Employer invites: admin-generated tokens with optional expiration and email delivery.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employer_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_employer_invites_token ON public.employer_invites(token);
CREATE INDEX IF NOT EXISTS idx_employer_invites_expires_at ON public.employer_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_employer_invites_created_by ON public.employer_invites(created_by);

ALTER TABLE public.employer_invites ENABLE ROW LEVEL SECURITY;

-- Only service role / backend (admin APIs) can read/write; no direct client access.
CREATE POLICY "Service role only employer_invites"
  ON public.employer_invites FOR ALL
  USING (false);

COMMENT ON TABLE public.employer_invites IS 'Admin-created employer invite tokens; optional email and expiration. Send manually or via system.';
