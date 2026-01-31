-- Security Agency: guard_licenses (full schema), compliance_alerts, profiles.guard_credential_score.
-- Idempotent. Only for plan_tier = security_agency.

CREATE TABLE IF NOT EXISTS public.guard_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  license_number TEXT,
  state TEXT,
  license_type TEXT NOT NULL DEFAULT 'license',
  issue_date DATE,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','expired','suspended','pending')),
  uploaded_document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guard_licenses_employer ON public.guard_licenses(employer_id);
CREATE INDEX IF NOT EXISTS idx_guard_licenses_user ON public.guard_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_guard_licenses_expiration ON public.guard_licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_guard_licenses_status ON public.guard_licenses(status);

ALTER TABLE public.guard_licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_guard_licenses" ON public.guard_licenses;
CREATE POLICY "service_role_guard_licenses" ON public.guard_licenses FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.compliance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  license_id UUID REFERENCES public.guard_licenses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('30_day_warning','expired')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_employer ON public.compliance_alerts(employer_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_resolved ON public.compliance_alerts(resolved);

ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_compliance_alerts" ON public.compliance_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guard_credential_score NUMERIC;
