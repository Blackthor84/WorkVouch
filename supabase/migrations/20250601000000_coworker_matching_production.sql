-- ============================================================================
-- Coworker matching production fixes (idempotent)
-- WorkVouch uses coworker_matches (user1_id, user2_id, job1_id, job2_id), not "matches".
-- This migration: dedup, ensure unique index, add status, normalize company in logic.
-- ============================================================================

-- A. Remove duplicate rows (keep one per user1_id, user2_id, job1_id, job2_id)
DELETE FROM public.coworker_matches a
USING public.coworker_matches b
WHERE a.id < b.id
  AND a.user1_id = b.user1_id
  AND a.user2_id = b.user2_id
  AND a.job1_id = b.job1_id
  AND a.job2_id = b.job2_id;

-- B. Ensure unique index exists (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS unique_coworker_match_pair_jobs
  ON public.coworker_matches (user1_id, user2_id, job1_id, job2_id);

-- C. Add status column if missing (default 'pending')
ALTER TABLE public.coworker_matches
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- D. Normalize existing jobs company_name (optional, recommended)
UPDATE public.jobs
SET company_name = LOWER(TRIM(company_name))
WHERE company_name IS NOT NULL
  AND company_name != LOWER(TRIM(company_name));

-- E. Replace detect_coworker_matches to store normalized company_name
CREATE OR REPLACE FUNCTION public.detect_coworker_matches(p_job_id UUID)
RETURNS VOID AS $$
DECLARE
  v_job RECORD;
  v_matching_jobs RECORD;
  v_user1_id UUID;
  v_user2_id UUID;
  v_match_confidence DECIMAL(3,2);
  v_company_normalized TEXT;
BEGIN
  SELECT * INTO v_job
  FROM public.jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_company_normalized := LOWER(TRIM(v_job.company_name));
  IF v_company_normalized IS NULL OR v_company_normalized = '' THEN
    RETURN;
  END IF;

  FOR v_matching_jobs IN
    SELECT j.*
    FROM public.jobs j
    WHERE j.id != p_job_id
      AND j.user_id != v_job.user_id
      AND j.is_private = false
      AND LOWER(TRIM(j.company_name)) = v_company_normalized
      AND (
        (v_job.start_date <= COALESCE(j.end_date, '9999-12-31'::DATE))
        AND (COALESCE(v_job.end_date, '9999-12-31'::DATE) >= j.start_date)
      )
  LOOP
    IF v_job.user_id < v_matching_jobs.user_id THEN
      v_user1_id := v_job.user_id;
      v_user2_id := v_matching_jobs.user_id;
    ELSE
      v_user1_id := v_matching_jobs.user_id;
      v_user2_id := v_job.user_id;
    END IF;

    v_match_confidence := calculate_date_overlap_confidence(
      v_job.start_date,
      COALESCE(v_job.end_date, CURRENT_DATE),
      v_matching_jobs.start_date,
      COALESCE(v_matching_jobs.end_date, CURRENT_DATE)
    );

    INSERT INTO public.coworker_matches (
      user1_id, user2_id, job1_id, job2_id, company_name, match_confidence
    )
    VALUES (
      v_user1_id,
      v_user2_id,
      CASE WHEN v_job.user_id = v_user1_id THEN v_job.id ELSE v_matching_jobs.id END,
      CASE WHEN v_job.user_id = v_user1_id THEN v_matching_jobs.id ELSE v_job.id END,
      v_company_normalized,
      v_match_confidence
    )
    ON CONFLICT (user1_id, user2_id, job1_id, job2_id) DO NOTHING;

    INSERT INTO public.notifications (user_id, type, title, message, related_user_id, related_job_id)
    VALUES
      (
        v_user1_id,
        'coworker_match',
        'Potential Coworker Found',
        'You may know ' || COALESCE((SELECT full_name FROM public.profiles WHERE id = v_user2_id), 'a coworker') ||
        ' from ' || v_company_normalized || '. Leave a reference?',
        v_user2_id,
        CASE WHEN v_job.user_id = v_user1_id THEN v_job.id ELSE v_matching_jobs.id END
      ),
      (
        v_user2_id,
        'coworker_match',
        'Potential Coworker Found',
        'You may know ' || COALESCE((SELECT full_name FROM public.profiles WHERE id = v_user1_id), 'a coworker') ||
        ' from ' || v_company_normalized || '. Leave a reference?',
        v_user1_id,
        CASE WHEN v_job.user_id = v_user1_id THEN v_job.id ELSE v_matching_jobs.id END
      )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.detect_coworker_matches(UUID) IS 'Creates coworker_matches for a new job; normalizes company_name; prevents duplicates.';

-- F. Ensure trigger function and trigger exist (idempotent)
CREATE OR REPLACE FUNCTION public.trigger_detect_coworker_matches()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_private = false THEN
    PERFORM detect_coworker_matches(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS detect_matches_on_job_insert ON public.jobs;
CREATE TRIGGER detect_matches_on_job_insert
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_detect_coworker_matches();
