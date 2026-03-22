-- Denormalized vouch_status slug (matches app getStatus / vouch_tier bands).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vouch_status TEXT NOT NULL DEFAULT 'no_vouch';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_vouch_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_vouch_status_check
  CHECK (vouch_status IN ('no_vouch', 'starter', 'verified', 'trusted'));

COMMENT ON COLUMN public.profiles.vouch_status IS 'Slug from vouch_count: no_vouch | starter (1) | verified (2-4) | trusted (5+).';

CREATE OR REPLACE FUNCTION public.refresh_user_vouch_stats(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c integer;
  t smallint;
  s text;
BEGIN
  SELECT COUNT(*)::integer INTO c
  FROM public.coworker_invites
  WHERE sender_id = p_user_id AND status = 'accepted';

  IF c <= 0 THEN
    t := 0;
    s := 'no_vouch';
  ELSIF c = 1 THEN
    t := 1;
    s := 'starter';
  ELSIF c < 5 THEN
    t := 2;
    s := 'verified';
  ELSE
    t := 3;
    s := 'trusted';
  END IF;

  UPDATE public.profiles
  SET vouch_count = c, vouch_tier = t, vouch_status = s
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.refresh_user_vouch_stats IS 'Sets profiles.vouch_count, vouch_tier, vouch_status from accepted coworker_invites sent by user.';

-- Backfill vouch_status from existing counts
UPDATE public.profiles
SET vouch_status = CASE
  WHEN vouch_count >= 5 THEN 'trusted'
  WHEN vouch_count >= 2 THEN 'verified'
  WHEN vouch_count >= 1 THEN 'starter'
  ELSE 'no_vouch'
END
WHERE vouch_status IS DISTINCT FROM CASE
  WHEN vouch_count >= 5 THEN 'trusted'
  WHEN vouch_count >= 2 THEN 'verified'
  WHEN vouch_count >= 1 THEN 'starter'
  ELSE 'no_vouch'
END;
