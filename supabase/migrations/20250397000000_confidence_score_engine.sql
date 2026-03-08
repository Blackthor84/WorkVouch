-- ============================================================================
-- Confidence Score Engine — trust score for employment (reputation/credibility).
-- Rules: +20 per verified job, +10 per coworker verification, +5 bonus for 2+ verifications.
-- Uses employment_records (verified) and employment_matches (confirmed).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_confidence_score(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score INTEGER := 0;
  verified_jobs INTEGER;
  coworker_verifications INTEGER;
BEGIN
  -- +20 per verified job (employment_records with verification_status = 'verified')
  SELECT COUNT(*)::INTEGER INTO verified_jobs
  FROM public.employment_records
  WHERE user_id = user_uuid
    AND verification_status = 'verified';

  score := verified_jobs * 20;

  -- +10 per coworker verification (confirmed employment_match on the user's records)
  SELECT COUNT(*)::INTEGER INTO coworker_verifications
  FROM public.employment_matches m
  INNER JOIN public.employment_records r ON r.id = m.employment_record_id
  WHERE r.user_id = user_uuid
    AND m.match_status = 'confirmed';

  score := score + (coworker_verifications * 10);

  -- +5 bonus when 2+ coworker verifications
  IF coworker_verifications >= 2 THEN
    score := score + 5;
  END IF;

  RETURN GREATEST(0, score);
END;
$$;

COMMENT ON FUNCTION public.calculate_confidence_score(UUID) IS
  'Confidence score: +20 per verified job, +10 per coworker verification, +5 bonus for 2+ verifications.';

-- View for UI: user_id -> confidence_score (integer points)
CREATE OR REPLACE VIEW public.user_confidence_scores AS
SELECT
  p.id AS user_id,
  public.calculate_confidence_score(p.id) AS confidence_score
FROM public.profiles p;

COMMENT ON VIEW public.user_confidence_scores IS
  'Per-user confidence score (points). Used by dashboard and profile trust badges.';

-- RLS: users can read their own row from the view (view has no RLS; we gate by auth in API).
-- If the view is queried via service role in API, no policy needed. If queried via anon/authenticated, add:
-- (View is not a table; RLS on underlying tables applies when view is used with invoker. We use SECURITY DEFINER on the function so the view can be read by API with service role.)
