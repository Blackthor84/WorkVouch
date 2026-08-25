-- Phase 2A: Secure tokens for Connect candidate invitations (additive only)

BEGIN;

CREATE TABLE IF NOT EXISTS public.connect_candidate_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_queue_id UUID REFERENCES public.connect_invitation_queue(id) ON DELETE SET NULL,
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  employer_account_id TEXT NOT NULL,
  connect_candidate_map_id UUID NOT NULL,
  external_candidate_id TEXT NOT NULL,
  external_application_id TEXT,
  external_job_id TEXT,
  candidate_email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'claimed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  claimed_profile_id UUID,
  invited_by_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connect_candidate_invites_token_hash
  ON public.connect_candidate_invites (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connect_candidate_invites_active
  ON public.connect_candidate_invites (connection_id, external_candidate_id)
  WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_connect_candidate_invites_map
  ON public.connect_candidate_invites (connect_candidate_map_id);

CREATE INDEX IF NOT EXISTS idx_connect_candidate_invites_employer
  ON public.connect_candidate_invites (employer_account_id, status);

COMMENT ON TABLE public.connect_candidate_invites IS
  'Employer-initiated WorkVouch profile invitations for ATS-imported candidates. Token stored hashed only.';

COMMIT;
