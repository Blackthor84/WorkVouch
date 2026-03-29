-- Applies trust_score + created_at for databases that already ran 20260328120000
-- before those columns were added (idempotent).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.profiles.trust_score IS 'Denormalized trust 0–100; optional engine write; trust_scores table remains canonical for ranking UI.';
COMMENT ON COLUMN public.profiles.created_at IS 'When the profile row was created.';

NOTIFY pgrst, 'reload schema';
