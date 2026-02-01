-- Work Passport visibility model. All accounts PRIVATE by default.
-- Nothing publicly searchable unless is_public_passport = true.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public_passport BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS searchable_by_verified_employers BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS searchable_by_shared_employers BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.is_public_passport IS 'When true, profile is shown as full Public Passport at /passport/[username]. Default false = private.';
COMMENT ON COLUMN public.profiles.searchable_by_verified_employers IS 'When true, verified employers can see Limited Employer View. Ignored if is_public_passport.';
COMMENT ON COLUMN public.profiles.searchable_by_shared_employers IS 'When true, users with shared verified employment can see Limited Shared View. Ignored if is_public_passport.';

-- Optional: set existing visibility to private by default (uncomment if desired)
-- UPDATE public.profiles SET is_public_passport = false WHERE is_public_passport IS NULL;
