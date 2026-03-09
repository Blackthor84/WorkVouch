-- Add verifier_email to job_verifications for token-based verification (coworker may not be logged in)
ALTER TABLE public.job_verifications
  ADD COLUMN IF NOT EXISTS verifier_email TEXT;

CREATE INDEX IF NOT EXISTS idx_job_verifications_verifier_email ON public.job_verifications(verifier_email) WHERE verifier_email IS NOT NULL;

COMMENT ON COLUMN public.job_verifications.verifier_email IS 'Email of coworker who confirmed (when verified via link token, may not have account).';
