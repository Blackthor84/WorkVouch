-- ============================================================================
-- Usage Tracking Tables for Search and Report Limits
-- ============================================================================

-- Employer Searches Table (tracks profile searches)
CREATE TABLE IF NOT EXISTS public.employer_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS employer_searches_employer_id_idx 
  ON public.employer_searches(employer_id);
CREATE INDEX IF NOT EXISTS employer_searches_created_at_idx 
  ON public.employer_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS employer_searches_employer_month_idx 
  ON public.employer_searches(employer_id, created_at);

-- Verification Reports Table (tracks report generation)
CREATE TABLE IF NOT EXISTS public.verification_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'full',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS verification_reports_employer_id_idx 
  ON public.verification_reports(employer_id);
CREATE INDEX IF NOT EXISTS verification_reports_created_at_idx 
  ON public.verification_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS verification_reports_employer_month_idx 
  ON public.verification_reports(employer_id, created_at);

-- Enable RLS
ALTER TABLE public.employer_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Employers can view their own usage
CREATE POLICY "Employers can view own searches" ON public.employer_searches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employer_accounts
      WHERE id = employer_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can view own reports" ON public.verification_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employer_accounts
      WHERE id = employer_id
      AND user_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all searches" ON public.employer_searches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can view all reports" ON public.verification_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
