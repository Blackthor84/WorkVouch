-- Add onboarding_completed to profiles for Smart Onboarding.
-- Run in Supabase SQL Editor.
-- Once set to true, the onboarding walkthrough is never shown again.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'When true, the user has completed or skipped the post-signup onboarding walkthrough.';
