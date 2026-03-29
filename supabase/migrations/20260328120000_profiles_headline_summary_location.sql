-- Core profile columns expected by app (idempotent).
-- PostgREST: reload schema cache so new columns are visible immediately.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS professional_summary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.profiles.full_name IS 'Display name for the worker profile.';
COMMENT ON COLUMN public.profiles.professional_summary IS 'Bio / professional summary.';
COMMENT ON COLUMN public.profiles.headline IS 'Short professional headline (distinct from account role).';
COMMENT ON COLUMN public.profiles.location IS 'Coarse region label (e.g. state); do not store street or city.';
COMMENT ON COLUMN public.profiles.trust_score IS 'Denormalized trust 0–100; optional engine write; trust_scores table remains canonical for ranking UI.';
COMMENT ON COLUMN public.profiles.created_at IS 'When the profile row was created.';

NOTIFY pgrst, 'reload schema';
