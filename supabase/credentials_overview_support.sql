-- Support for CredentialsOverview component: profiles.guard_credential_score + employee_credentials.
-- Run in Supabase SQL editor. Idempotent.

-- 1. profiles.guard_credential_score (if not already added by security_agency_licenses_compliance.sql)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guard_credential_score NUMERIC;

-- 2. employee_credentials table (expected by components/employer/CredentialsOverview.tsx)
CREATE TABLE IF NOT EXISTS public.employee_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  expiration_date DATE,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_credentials_profile ON public.employee_credentials(profile_id);
CREATE INDEX IF NOT EXISTS idx_employee_credentials_employer ON public.employee_credentials(employer_id);
CREATE INDEX IF NOT EXISTS idx_employee_credentials_expiration ON public.employee_credentials(expiration_date);

ALTER TABLE public.employee_credentials ENABLE ROW LEVEL SECURITY;

-- Service role full access (API routes).
DROP POLICY IF EXISTS "service_role_employee_credentials" ON public.employee_credentials;
CREATE POLICY "service_role_employee_credentials"
  ON public.employee_credentials FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Employers can read credentials for their organization.
DROP POLICY IF EXISTS "employer_read_employee_credentials" ON public.employee_credentials;
CREATE POLICY "employer_read_employee_credentials"
  ON public.employee_credentials FOR SELECT TO authenticated
  USING (
    employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid())
  );

-- Users can read their own credentials.
DROP POLICY IF EXISTS "user_read_own_employee_credentials" ON public.employee_credentials;
CREATE POLICY "user_read_own_employee_credentials"
  ON public.employee_credentials FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

COMMENT ON TABLE public.employee_credentials IS 'Credentials overview: certifications/training per profile. Used by CredentialsOverview dashboard.';
