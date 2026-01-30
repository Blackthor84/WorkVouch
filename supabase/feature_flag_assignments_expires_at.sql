-- Add optional expiration to feature flag assignments (beta access, trials).
-- Run in Supabase SQL editor.

ALTER TABLE public.feature_flag_assignments
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.feature_flag_assignments.expires_at IS 'When set, assignment is treated as disabled after this time.';
