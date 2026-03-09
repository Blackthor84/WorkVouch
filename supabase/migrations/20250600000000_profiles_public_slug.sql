-- Add public_slug for /candidate/[slug] shareable URLs (employer-paid access).
-- Workers share https://tryworkvouch.com/candidate/{public_slug}

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_slug
  ON public.profiles(public_slug)
  WHERE public_slug IS NOT NULL;

COMMENT ON COLUMN public.profiles.public_slug IS 'Unique slug for candidate profile URL /candidate/[slug]. Used for employer-paid profile access.';
