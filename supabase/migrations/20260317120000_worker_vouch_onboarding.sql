-- Worker mobile-first vouch loop: contacts draft, vouch tiers, onboarding completion, reminder queue.

-- 1) Profiles: vouch stats + onboarding loop completion timestamp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vouch_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vouch_tier SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS worker_onboarding_loop_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.vouch_count IS 'Accepted coworker invites sent by this user (vouch confirmations).';
COMMENT ON COLUMN public.profiles.vouch_tier IS '0=none, 1=one vouch, 2=verified (2-4), 3=trusted (5+).';
COMMENT ON COLUMN public.profiles.worker_onboarding_loop_completed_at IS 'Employee finished WorkVouch vouch onboarding wizard (job + contacts + send/confirm).';

-- 2) Onboarding coworker slots (before invites are created)
CREATE TABLE IF NOT EXISTS public.worker_onboarding_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL CHECK (position IN (1, 2)),
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  coworker_invite_id UUID REFERENCES public.coworker_invites(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, position),
  CONSTRAINT worker_onboarding_contacts_contact_chk CHECK (
    length(trim(display_name)) > 0
    AND (email IS NOT NULL AND length(trim(email)) > 0 OR phone IS NOT NULL AND length(trim(phone)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_worker_onboarding_contacts_user ON public.worker_onboarding_contacts(user_id);

ALTER TABLE public.worker_onboarding_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own onboarding contacts" ON public.worker_onboarding_contacts;
CREATE POLICY "Users manage own onboarding contacts"
  ON public.worker_onboarding_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.worker_onboarding_contacts IS 'Mobile onboarding: up to 2 coworkers (name + email/phone) before invites are sent.';

-- 3) Reminder queue for cron (service role)
CREATE TABLE IF NOT EXISTS public.worker_onboarding_reminder_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_kind TEXT NOT NULL CHECK (reminder_kind IN ('1h', '24h', '48h')),
  run_after TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reminder_kind)
);

CREATE INDEX IF NOT EXISTS idx_worker_onboarding_reminder_due
  ON public.worker_onboarding_reminder_queue(run_after)
  WHERE sent_at IS NULL;

ALTER TABLE public.worker_onboarding_reminder_queue ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.worker_onboarding_reminder_queue IS 'Deferred nudges for incomplete vouch onboarding; processed by cron with service role.';

-- 4) Recompute vouch_count / vouch_tier for inviter (accepted invites only)
CREATE OR REPLACE FUNCTION public.refresh_user_vouch_stats(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c integer;
  t smallint;
BEGIN
  SELECT COUNT(*)::integer INTO c
  FROM public.coworker_invites
  WHERE sender_id = p_user_id AND status = 'accepted';

  IF c <= 0 THEN
    t := 0;
  ELSIF c = 1 THEN
    t := 1;
  ELSIF c < 5 THEN
    t := 2;
  ELSE
    t := 3;
  END IF;

  UPDATE public.profiles
  SET vouch_count = c, vouch_tier = t
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.refresh_user_vouch_stats IS 'Sets profiles.vouch_count from accepted coworker_invites sent by user; tier 0/1/2/3.';

-- 5) Backfill: existing active employees skip forced wizard
UPDATE public.profiles p
SET worker_onboarding_loop_completed_at = COALESCE(p.created_at, NOW())
WHERE (p.role IS NULL OR LOWER(TRIM(p.role)) = 'employee')
  AND p.worker_onboarding_loop_completed_at IS NULL
  AND (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.user_id = p.id)
    OR EXISTS (SELECT 1 FROM public.coworker_invites ci WHERE ci.sender_id = p.id)
    OR EXISTS (SELECT 1 FROM public.coworker_references cr WHERE cr.reviewed_id = p.id)
    OR EXISTS (SELECT 1 FROM public.user_references ur WHERE ur.to_user_id = p.id)
  );

-- Initial vouch stats from existing accepted invites
UPDATE public.profiles p
SET vouch_count = sub.cnt
FROM (
  SELECT sender_id, COUNT(*)::integer AS cnt
  FROM public.coworker_invites
  WHERE status = 'accepted'
  GROUP BY sender_id
) sub
WHERE p.id = sub.sender_id;

UPDATE public.profiles
SET vouch_tier = CASE
  WHEN vouch_count <= 0 THEN 0
  WHEN vouch_count = 1 THEN 1
  WHEN vouch_count < 5 THEN 2
  ELSE 3
END
WHERE vouch_count IS NOT NULL;
