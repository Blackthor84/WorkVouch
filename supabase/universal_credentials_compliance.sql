-- Universal Credential and Compliance Tracking
-- professional_credentials table + extend compliance_alerts for credentials.
-- Idempotent.

-- ============================================================
-- STEP 1 — PROFESSIONAL_CREDENTIALS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.professional_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  credential_name TEXT NOT NULL,
  issuing_authority TEXT,
  credential_number TEXT,
  issue_date DATE,
  expiration_date DATE,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','rejected')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','suspended')),
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credentials_user ON public.professional_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_employer ON public.professional_credentials(employer_id);
CREATE INDEX IF NOT EXISTS idx_credentials_expiration ON public.professional_credentials(expiration_date);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON public.professional_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON public.professional_credentials(status);

COMMENT ON TABLE public.professional_credentials IS 'Universal credentials: guard licenses, certs, training renewals.';

-- ============================================================
-- STEP 2 — EXTEND COMPLIANCE_ALERTS FOR CREDENTIALS
-- ============================================================

-- Add credential_id so alerts can reference professional_credentials (license_id remains for guard_licenses).
ALTER TABLE public.compliance_alerts
  ADD COLUMN IF NOT EXISTS credential_id UUID REFERENCES public.professional_credentials(id) ON DELETE CASCADE;

-- Allow license_id to be null when alert is for a credential (not a guard_license).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'compliance_alerts' AND column_name = 'license_id'
  ) THEN
    ALTER TABLE public.compliance_alerts ALTER COLUMN license_id DROP NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- column may already be nullable or not exist
END $$;

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_credential ON public.compliance_alerts(credential_id);

-- ============================================================
-- STEP 3 — RLS FOR PROFESSIONAL_CREDENTIALS
-- ============================================================

ALTER TABLE public.professional_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_professional_credentials" ON public.professional_credentials;
CREATE POLICY "service_role_professional_credentials"
  ON public.professional_credentials FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Employers can read credentials for their organization.
DROP POLICY IF EXISTS "employer_read_own_credentials" ON public.professional_credentials;
CREATE POLICY "employer_read_own_credentials"
  ON public.professional_credentials FOR SELECT TO authenticated
  USING (
    employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid())
  );

-- Users can read their own credentials.
DROP POLICY IF EXISTS "user_read_own_credentials" ON public.professional_credentials;
CREATE POLICY "user_read_own_credentials"
  ON public.professional_credentials FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Writes go through service role only (app backend uses service role for uploads/updates).

-- ============================================================
-- OPTIONAL: updated_at trigger for professional_credentials
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at_credentials()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_professional_credentials ON public.professional_credentials;
CREATE TRIGGER set_updated_at_professional_credentials
  BEFORE UPDATE ON public.professional_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_credentials();
