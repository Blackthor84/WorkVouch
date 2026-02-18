-- Ensure public.profiles has onboarding_completed for /api/user/me and /api/onboarding/complete.
-- No tables dropped; additive only.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'When true, the user has completed or skipped the post-signup onboarding walkthrough.';
