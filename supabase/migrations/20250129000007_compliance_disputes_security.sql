-- ============================================================================
-- COMPLIANCE DISPUTES (policy workflow) + SECURITY REPORTS
-- Enums and tables for dispute workflow and security reporting.
-- ============================================================================

-- Compliance dispute enums
DO $$ BEGIN
  CREATE TYPE compliance_dispute_type_enum AS ENUM (
    'RehireStatus',
    'EmploymentDates',
    'PeerVerification',
    'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE compliance_dispute_status_enum AS ENUM (
    'Pending',
    'UnderReview',
    'AwaitingEmployerResponse',
    'Resolved',
    'Rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- compliance_disputes: policy-level dispute workflow
CREATE TABLE IF NOT EXISTS public.compliance_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dispute_type compliance_dispute_type_enum NOT NULL,
  description TEXT NOT NULL,
  status compliance_dispute_status_enum NOT NULL DEFAULT 'Pending',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compliance_disputes_user_id ON public.compliance_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_disputes_profile_id ON public.compliance_disputes(profile_id);
CREATE INDEX IF NOT EXISTS idx_compliance_disputes_status ON public.compliance_disputes(status);
CREATE INDEX IF NOT EXISTS idx_compliance_disputes_created_at ON public.compliance_disputes(created_at DESC);

ALTER TABLE public.compliance_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own compliance_disputes" ON public.compliance_disputes;
CREATE POLICY "Users see own compliance_disputes"
  ON public.compliance_disputes FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own compliance_disputes" ON public.compliance_disputes;
CREATE POLICY "Users insert own compliance_disputes"
  ON public.compliance_disputes FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage compliance_disputes" ON public.compliance_disputes;
CREATE POLICY "Admins manage compliance_disputes"
  ON public.compliance_disputes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
  WITH CHECK (true);

COMMENT ON TABLE public.compliance_disputes IS 'Policy-level dispute workflow; identity verification required before submission.';

-- Security report enums and table
DO $$ BEGIN
  CREATE TYPE security_report_severity_enum AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE security_report_status_enum AS ENUM (
    'Open',
    'Investigating',
    'Resolved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.security_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_email TEXT NOT NULL,
  description TEXT NOT NULL,
  severity security_report_severity_enum NOT NULL DEFAULT 'medium',
  status security_report_status_enum NOT NULL DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_reports_status ON public.security_reports(status);
CREATE INDEX IF NOT EXISTS idx_security_reports_created_at ON public.security_reports(created_at DESC);

ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can read; anyone can insert (for reporting)
DROP POLICY IF EXISTS "Anyone can submit security_reports" ON public.security_reports;
CREATE POLICY "Anyone can submit security_reports"
  ON public.security_reports FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins see security_reports" ON public.security_reports;
CREATE POLICY "Admins see security_reports"
  ON public.security_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

COMMENT ON TABLE public.security_reports IS 'Security incident and vulnerability reports; admin-only read.';
