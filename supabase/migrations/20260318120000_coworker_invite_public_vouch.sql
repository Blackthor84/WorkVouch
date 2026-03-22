-- Public vouch confirmation (no account): SMS/email link → /vouch/confirm/:token
-- Tracking: invite_sent_at, invite_opened_at; declined status + declined_at

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname AS name
    FROM pg_constraint c
    WHERE c.conrelid = 'public.coworker_invites'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%pending%'
      AND pg_get_constraintdef(c.oid) LIKE '%accepted%'
  LOOP
    EXECUTE format('ALTER TABLE public.coworker_invites DROP CONSTRAINT %I', r.name);
  END LOOP;
END $$;

ALTER TABLE public.coworker_invites
  ADD CONSTRAINT coworker_invites_status_check
  CHECK (status IN ('pending', 'accepted', 'declined'));

ALTER TABLE public.coworker_invites
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

-- Allow SMS-only invites; keep existing rows with email
ALTER TABLE public.coworker_invites
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.coworker_invites
  DROP CONSTRAINT IF EXISTS coworker_invites_email_or_phone_chk;

ALTER TABLE public.coworker_invites
  ADD CONSTRAINT coworker_invites_email_or_phone_chk
  CHECK (
    (email IS NOT NULL AND length(trim(email)) > 0)
    OR (phone IS NOT NULL AND length(trim(phone)) > 0)
  );

DROP INDEX IF EXISTS public.coworker_invites_sender_email_pending;

CREATE UNIQUE INDEX IF NOT EXISTS coworker_invites_sender_email_pending
  ON public.coworker_invites (sender_id, lower(trim(email)))
  WHERE status = 'pending' AND email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS coworker_invites_sender_phone_pending
  ON public.coworker_invites (sender_id, regexp_replace(trim(phone), '[^0-9+]', '', 'g'))
  WHERE status = 'pending' AND phone IS NOT NULL AND length(trim(phone)) > 0;

COMMENT ON COLUMN public.coworker_invites.invite_sent_at IS 'When invite email/SMS was dispatched (invite_sent).';
COMMENT ON COLUMN public.coworker_invites.invite_opened_at IS 'First time recipient opened public confirm link (invite_opened).';
COMMENT ON COLUMN public.coworker_invites.declined_at IS 'When recipient declined vouch on public page.';
COMMENT ON TABLE public.coworker_invites IS 'Coworker invites: token link for signup claim and/or public vouch confirm without account.';
