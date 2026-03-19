-- Optional headline for profile (all fields optional, save-anytime UX)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
COMMENT ON COLUMN public.profiles.headline IS 'Optional professional headline. All profile fields optional.';
