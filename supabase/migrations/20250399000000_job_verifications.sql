-- ============================================================================
-- job_verifications: record when a coworker confirms a job (for /verify/[jobId] flow).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  verifier_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_verifications_job_id ON public.job_verifications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_verifications_verifier ON public.job_verifications(verifier_user_id);

COMMENT ON TABLE public.job_verifications IS 'Records when a user confirms they worked with the job owner at the company (used by /verify/[jobId]).';

ALTER TABLE public.job_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.job_verifications;
CREATE POLICY "Allow insert for authenticated"
  ON public.job_verifications FOR INSERT
  TO authenticated
  WITH CHECK (verifier_user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access job_verifications" ON public.job_verifications;
CREATE POLICY "Service role full access job_verifications"
  ON public.job_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);
