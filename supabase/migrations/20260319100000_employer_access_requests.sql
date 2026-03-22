-- Employer marketing leads from /employers landing (request access form).
-- Inserts only via service role (admin API); RLS enabled with no policies for JWT roles.

CREATE TABLE IF NOT EXISTS public.employer_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'employers_landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employer_access_requests_full_name_len CHECK (char_length(trim(full_name)) >= 1 AND char_length(full_name) <= 200),
  CONSTRAINT employer_access_requests_company_len CHECK (char_length(trim(company_name)) >= 1 AND char_length(company_name) <= 200),
  CONSTRAINT employer_access_requests_email_len CHECK (char_length(trim(email)) >= 3 AND char_length(email) <= 320)
);

CREATE INDEX IF NOT EXISTS idx_employer_access_requests_created
  ON public.employer_access_requests (created_at DESC);

ALTER TABLE public.employer_access_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.employer_access_requests IS 'Employer access / demo requests from public marketing; written only via admin API.';
