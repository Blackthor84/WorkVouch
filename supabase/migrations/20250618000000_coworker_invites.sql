-- ============================================================================
-- Coworker invite growth loop: tokenized invites → signup → claim → matches/trust
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coworker_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  company_normalized TEXT,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS coworker_invites_sender_email_pending
  ON public.coworker_invites (sender_id, lower(trim(email)))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_coworker_invites_token ON public.coworker_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_coworker_invites_sender ON public.coworker_invites(sender_id);
CREATE INDEX IF NOT EXISTS idx_coworker_invites_email_lower ON public.coworker_invites(lower(trim(email)));

ALTER TABLE public.coworker_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own coworker_invites" ON public.coworker_invites;
CREATE POLICY "Users insert own coworker_invites"
  ON public.coworker_invites FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users select own coworker_invites" ON public.coworker_invites;
CREATE POLICY "Users select own coworker_invites"
  ON public.coworker_invites FOR SELECT
  USING (auth.uid() = sender_id);

COMMENT ON TABLE public.coworker_invites IS 'Viral coworker invites: email + shareable /signup?invite=token; claim links invitee to inviter for matching.';
