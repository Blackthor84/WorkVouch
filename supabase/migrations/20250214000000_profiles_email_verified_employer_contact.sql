-- ============================================================================
-- profiles.email_verified: track verification after email change
-- employer_accounts.contact_email: optional contact email for company
-- ============================================================================

-- profiles.email_verified (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;
COMMENT ON COLUMN public.profiles.email_verified IS 'False after email change until user verifies new address.';

-- employer_accounts.contact_email (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employer_accounts' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE public.employer_accounts ADD COLUMN contact_email TEXT;
  END IF;
END $$;
COMMENT ON COLUMN public.employer_accounts.contact_email IS 'Optional contact email for the company.';
