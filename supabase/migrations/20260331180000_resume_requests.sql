-- Employers request access to candidate resumes (workflow stub: status starts at pending)
CREATE TABLE IF NOT EXISTS public.resume_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_resume_requests_employer_created
  ON public.resume_requests(employer_id, created_at DESC);

ALTER TABLE public.resume_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers read own resume requests" ON public.resume_requests;
CREATE POLICY "Employers read own resume requests"
  ON public.resume_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employer_accounts ea
      WHERE ea.id = resume_requests.employer_id AND ea.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Employers insert own resume requests" ON public.resume_requests;
CREATE POLICY "Employers insert own resume requests"
  ON public.resume_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employer_accounts ea
      WHERE ea.id = resume_requests.employer_id AND ea.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.resume_requests IS 'Employer-initiated resume access requests; API uses service role with ownership checks.';
