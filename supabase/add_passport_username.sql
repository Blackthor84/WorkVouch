-- Optional: passport_username for /u/[username] shareable URLs.
-- If not set, public URL uses /u/<id> (UUID).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_passport_username ON public.profiles(passport_username) WHERE passport_username IS NOT NULL;
COMMENT ON COLUMN public.profiles.passport_username IS 'Optional handle for public Career Passport URL /u/[username].';
