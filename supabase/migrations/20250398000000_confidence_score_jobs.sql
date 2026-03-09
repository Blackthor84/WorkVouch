-- ============================================================================
-- Confidence score: include jobs table (verified) and job-based verification_requests.
-- Job flow: +20 per verified job, +10 per accepted coworker confirmation, +10 bonus for 3+.
-- ============================================================================

-- Add job_id to verification_requests if missing (for user-initiated job verification flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'job_id'
  ) THEN
    ALTER TABLE public.verification_requests ADD COLUMN job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'employment_record_id'
  ) THEN
    ALTER TABLE public.verification_requests ALTER COLUMN employment_record_id DROP NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_verification_requests_job_id ON public.verification_requests(job_id) WHERE job_id IS NOT NULL;

-- Extend confidence score to include jobs.verified + job-based verification_requests
CREATE OR REPLACE FUNCTION public.calculate_confidence_score(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score INTEGER := 0;
  verified_jobs_er INTEGER;
  coworker_verifications INTEGER;
  verified_jobs_jobs INTEGER;
  job_confirmations INTEGER;
BEGIN
  -- Existing: +20 per verified employment_record
  SELECT COUNT(*)::INTEGER INTO verified_jobs_er
  FROM public.employment_records
  WHERE user_id = user_uuid
    AND verification_status = 'verified';
  score := verified_jobs_er * 20;

  -- Existing: +10 per confirmed employment_match
  SELECT COUNT(*)::INTEGER INTO coworker_verifications
  FROM public.employment_matches m
  INNER JOIN public.employment_records r ON r.id = m.employment_record_id
  WHERE r.user_id = user_uuid
    AND m.match_status = 'confirmed';
  score := score + (coworker_verifications * 10);
  IF coworker_verifications >= 2 THEN
    score := score + 5;
  END IF;

  -- Jobs table: +20 per verified job (verification_status = 'verified')
  SELECT COUNT(*)::INTEGER INTO verified_jobs_jobs
  FROM public.jobs
  WHERE user_id = user_uuid
    AND verification_status = 'verified';
  score := score + (verified_jobs_jobs * 20);

  -- Job-based verification_requests: +10 per accepted confirmation
  SELECT COUNT(*)::INTEGER INTO job_confirmations
  FROM public.verification_requests vr
  INNER JOIN public.jobs j ON j.id = vr.job_id AND j.user_id = user_uuid
  WHERE vr.status = 'accepted' AND vr.job_id IS NOT NULL;
  score := score + (job_confirmations * 10);
  IF job_confirmations >= 3 THEN
    score := score + 10;
  END IF;

  RETURN GREATEST(0, LEAST(100, score));
END;
$$;

COMMENT ON FUNCTION public.calculate_confidence_score(UUID) IS
  'Confidence score: employment_records + employment_matches + jobs (verified) + job verification_requests (accepted).';
