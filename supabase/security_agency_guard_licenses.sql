-- Security Agency Bundle: guard_licenses table for license/certificate uploads.
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.guard_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  license_type TEXT NOT NULL DEFAULT 'license',
  file_path TEXT,
  file_name TEXT,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guard_licenses_employer ON public.guard_licenses(employer_id);
CREATE INDEX IF NOT EXISTS idx_guard_licenses_profile ON public.guard_licenses(profile_id);
CREATE INDEX IF NOT EXISTS idx_guard_licenses_expiration ON public.guard_licenses(expiration_date);

ALTER TABLE public.guard_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_guard_licenses" ON public.guard_licenses FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.guard_licenses IS 'Security Agency Bundle: uploaded guard licenses/certificates.';
