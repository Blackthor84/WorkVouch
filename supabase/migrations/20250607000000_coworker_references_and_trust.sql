-- ============================================================================
-- Coworker references: direct review per match (rating, reliability, teamwork, comment)
-- One review per match; only when match.status in ('accepted','confirmed').
-- Drives trust_scores for reviewed user: score = avg(rating,reliability,teamwork) * 20 (0-100).
-- ============================================================================

-- Table: coworker_references (spec "references" — name avoids SQL reserved word)
CREATE TABLE IF NOT EXISTS public.coworker_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.coworker_matches(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  reliability INTEGER NOT NULL CHECK (reliability >= 1 AND reliability <= 5),
  teamwork INTEGER NOT NULL CHECK (teamwork >= 1 AND teamwork <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coworker_references_no_self CHECK (reviewer_id != reviewed_id),
  CONSTRAINT coworker_references_one_per_match UNIQUE (match_id)
);

CREATE INDEX IF NOT EXISTS idx_coworker_references_reviewed ON public.coworker_references(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_coworker_references_reviewer ON public.coworker_references(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_coworker_references_match ON public.coworker_references(match_id);

ALTER TABLE public.coworker_references ENABLE ROW LEVEL SECURITY;

-- Only the reviewer can insert (and must be part of the match — enforced in app/trigger)
CREATE POLICY "Reviewers can insert own coworker references"
  ON public.coworker_references FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can view references they gave or received
CREATE POLICY "Users can view coworker references they are part of"
  ON public.coworker_references FOR SELECT
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_id);

COMMENT ON TABLE public.coworker_references IS 'One review per coworker match (rating, reliability, teamwork, comment). Only when match is accepted/confirmed.';

-- Trigger: validate match exists and status is accepted/confirmed before insert
CREATE OR REPLACE FUNCTION public.check_coworker_reference_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_user_1 UUID;
  v_user_2 UUID;
BEGIN
  SELECT status, user_1, user_2 INTO v_status, v_user_1, v_user_2
  FROM public.coworker_matches
  WHERE id = NEW.match_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  IF v_status IS NULL OR v_status NOT IN ('accepted', 'confirmed') THEN
    RAISE EXCEPTION 'Match must be accepted or confirmed to leave a review';
  END IF;
  IF NEW.reviewer_id NOT IN (v_user_1, v_user_2) OR NEW.reviewed_id NOT IN (v_user_1, v_user_2) THEN
    RAISE EXCEPTION 'Reviewer and reviewed must be the two users in the match';
  END IF;
  IF NEW.reviewer_id = NEW.reviewed_id THEN
    RAISE EXCEPTION 'Cannot review yourself';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_coworker_reference_match_trigger ON public.coworker_references;
CREATE TRIGGER check_coworker_reference_match_trigger
  BEFORE INSERT ON public.coworker_references
  FOR EACH ROW
  EXECUTE FUNCTION check_coworker_reference_match();

-- Recalculate trust score for a user from reference_feedback + coworker_references (merged)
-- Each source contributes 1-5 scale; score = overall_avg * 20 (0-100)
CREATE OR REPLACE FUNCTION public.recalculate_trust_from_coworker_references(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg NUMERIC;
  v_count INT;
  v_score NUMERIC;
BEGIN
  WITH combined AS (
    SELECT rating::NUMERIC AS val FROM reference_feedback WHERE target_user_id = p_user_id
    UNION ALL
    SELECT (rating + reliability + teamwork) / 3.0 FROM coworker_references WHERE reviewed_id = p_user_id
  )
  SELECT COALESCE(AVG(val), 0), COALESCE(COUNT(*)::INT, 0) INTO v_avg, v_count FROM combined;

  v_score := LEAST(100, GREATEST(0, (v_avg * 20.0)));

  INSERT INTO public.trust_scores (user_id, score, reference_count, average_rating, calculated_at, version)
  VALUES (p_user_id, v_score, v_count, v_avg, NOW(), 'v2')
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    reference_count = EXCLUDED.reference_count,
    average_rating = EXCLUDED.average_rating,
    calculated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_coworker_reference_trust()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_trust_from_coworker_references(NEW.reviewed_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS coworker_reference_update_trust ON public.coworker_references;
CREATE TRIGGER coworker_reference_update_trust
  AFTER INSERT ON public.coworker_references
  FOR EACH ROW
  EXECUTE FUNCTION trigger_coworker_reference_trust();

-- Use merged recalc for reference_feedback too so both flows contribute to one trust score
CREATE OR REPLACE FUNCTION public.trigger_reference_feedback_trust()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_trust_from_coworker_references(NEW.target_user_id);
  RETURN NEW;
END;
$$;
