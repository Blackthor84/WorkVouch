-- ============================================================================
-- Trust ranking v1 (core platform signal)
-- Formula: score = 100 * (
--   0.40 * rating_component (0–1, match-confidence weighted where available)
-- + 0.20 * review_volume (saturates at 10 reviews)
-- + 0.20 * match_strength (coworker match_confidence + employment confirm ratio)
-- + 0.20 * verified_jobs_ratio (verified employment_records / total)
-- )
-- Badges (UI): Verified 1+ reviews; Trusted 5+ & score>75; Elite 10+ & score>90
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Coworker reference validation: support user_1/user_2 OR user1_id/user2_id
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_coworker_reference_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_a UUID;
  v_b UUID;
BEGIN
  SELECT status, cm.user1_id, cm.user2_id
    INTO v_status, v_a, v_b
  FROM public.coworker_matches cm
  WHERE cm.id = NEW.match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_status IS NULL OR v_status NOT IN ('accepted', 'confirmed') THEN
    RAISE EXCEPTION 'Match must be accepted or confirmed to leave a review';
  END IF;

  IF NEW.reviewer_id NOT IN (v_a, v_b) OR NEW.reviewed_id NOT IN (v_a, v_b) THEN
    RAISE EXCEPTION 'Reviewer and reviewed must be the two users in the match';
  END IF;

  IF NEW.reviewer_id = NEW.reviewed_id THEN
    RAISE EXCEPTION 'Cannot review yourself';
  END IF;

  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2) RLS: coworker_matches — auth.uid() matches either user column set
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own matches" ON public.coworker_matches;
CREATE POLICY "Users can view own matches"
  ON public.coworker_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

COMMENT ON POLICY "Users can view own matches" ON public.coworker_matches IS
  'Bidirectional: show matches where current user is user1_id or user2_id.';

-- ----------------------------------------------------------------------------
-- 3) Main recalculation (replaces v2 average*20 model)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_trust_from_coworker_references(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weighted_rating_sum NUMERIC := 0;
  v_weight_sum NUMERIC := 0;
  v_rating_component NUMERIC := 0;
  v_review_count INT := 0;
  v_volume_component NUMERIC := 0;
  v_coworker_match_strength NUMERIC := 0;
  v_employment_confirm_ratio NUMERIC := 0;
  v_match_component NUMERIC := 0;
  v_verified_jobs_component NUMERIC := 0;
  v_score NUMERIC;
  v_display_avg NUMERIC := 0;
BEGIN
  -- Weighted rating (anti-gaming: strong coworker matches weigh more)
  SELECT
    COALESCE(SUM(x.r01 * x.w), 0),
    COALESCE(SUM(x.w), 0)
  INTO v_weighted_rating_sum, v_weight_sum
  FROM (
    SELECT
      (rf.rating::numeric / 5.0) AS r01,
      0.72::numeric AS w
    FROM public.reference_feedback rf
    WHERE rf.target_user_id = p_user_id

    UNION ALL

    SELECT
      (er.rating::numeric / 5.0) AS r01,
      0.78::numeric AS w
    FROM public.employment_references er
    INNER JOIN public.employment_matches em ON em.id = er.employment_match_id
    WHERE er.reviewed_user_id = p_user_id
      AND em.match_status = 'confirmed'::employment_match_status

    UNION ALL

    SELECT
      ((cr.rating + cr.reliability + cr.teamwork) / 3.0 / 5.0) AS r01,
      LEAST(
        1.0::numeric,
        GREATEST(0.32::numeric, COALESCE(cm.match_confidence, 0.55::numeric))
      ) AS w
    FROM public.coworker_references cr
    INNER JOIN public.coworker_matches cm ON cm.id = cr.match_id
    WHERE cr.reviewed_id = p_user_id
  ) AS x;

  IF v_weight_sum > 0 THEN
    v_rating_component := v_weighted_rating_sum / v_weight_sum;
  ELSE
    v_rating_component := 0;
  END IF;

  -- Review volume (raw count; saturates at 10 → 1.0)
  SELECT COALESCE(COUNT(*)::int, 0)
  INTO v_review_count
  FROM (
    SELECT 1
    FROM public.reference_feedback rf
    WHERE rf.target_user_id = p_user_id
    UNION ALL
    SELECT 1
    FROM public.employment_references er
    INNER JOIN public.employment_matches em ON em.id = er.employment_match_id
    WHERE er.reviewed_user_id = p_user_id
      AND em.match_status = 'confirmed'::employment_match_status
    UNION ALL
    SELECT 1
    FROM public.coworker_references cr
    WHERE cr.reviewed_id = p_user_id
  ) c;

  v_volume_component := LEAST(v_review_count::numeric / 10.0, 1.0);

  -- Match strength: avg coworker confidence (accepted/confirmed) + employment confirm ratio
  SELECT COALESCE(
    AVG(
      LEAST(1.0, GREATEST(0.0, COALESCE(cm.match_confidence, 0.5)))
    ),
    0
  )
  INTO v_coworker_match_strength
  FROM public.coworker_matches cm
  WHERE (cm.user1_id = p_user_id OR cm.user2_id = p_user_id)
    AND cm.status IN ('accepted', 'confirmed');

  SELECT COALESCE(
    COUNT(*) FILTER (WHERE em.match_status = 'confirmed'::employment_match_status)::numeric
    / NULLIF(COUNT(*)::numeric, 0),
    0
  )
  INTO v_employment_confirm_ratio
  FROM public.employment_matches em
  WHERE em.matched_user_id = p_user_id
     OR em.employment_record_id IN (
       SELECT er.id FROM public.employment_records er WHERE er.user_id = p_user_id
     );

  IF v_coworker_match_strength > 0 AND v_employment_confirm_ratio > 0 THEN
    v_match_component := (v_coworker_match_strength + v_employment_confirm_ratio) / 2.0;
  ELSIF v_coworker_match_strength > 0 THEN
    v_match_component := v_coworker_match_strength;
  ELSIF v_employment_confirm_ratio > 0 THEN
    v_match_component := v_employment_confirm_ratio;
  ELSE
    v_match_component := 0;
  END IF;

  -- Verified jobs share
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE verification_status = 'verified'::employment_verification_status)::numeric
    / NULLIF(COUNT(*)::numeric, 0),
    0
  )
  INTO v_verified_jobs_component
  FROM public.employment_records er
  WHERE er.user_id = p_user_id;

  v_score := LEAST(
    100,
    GREATEST(
      0,
      100.0 * (
        0.4 * v_rating_component
        + 0.2 * v_volume_component
        + 0.2 * v_match_component
        + 0.2 * v_verified_jobs_component
      )
    )
  );

  -- Display average (1–5): simple unweighted mean for dashboards (not used in formula)
  SELECT COALESCE(AVG(val), 0)
  INTO v_display_avg
  FROM (
    SELECT rf.rating::numeric AS val
    FROM public.reference_feedback rf
    WHERE rf.target_user_id = p_user_id
    UNION ALL
    SELECT er.rating::numeric AS val
    FROM public.employment_references er
    INNER JOIN public.employment_matches em ON em.id = er.employment_match_id
    WHERE er.reviewed_user_id = p_user_id
      AND em.match_status = 'confirmed'::employment_match_status
    UNION ALL
    SELECT ((cr.rating + cr.reliability + cr.teamwork) / 3.0) AS val
    FROM public.coworker_references cr
    WHERE cr.reviewed_id = p_user_id
  ) u;

  INSERT INTO public.trust_scores (
    user_id,
    score,
    reference_count,
    average_rating,
    calculated_at,
    version
  )
  VALUES (
    p_user_id,
    v_score,
    v_review_count,
    v_display_avg,
    NOW(),
    'rank-v1'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    reference_count = EXCLUDED.reference_count,
    average_rating = EXCLUDED.average_rating,
    calculated_at = NOW(),
    version = EXCLUDED.version;
END;
$$;

COMMENT ON FUNCTION public.recalculate_trust_from_coworker_references(UUID) IS
  'Trust rank v1: weighted blend of review quality (match-weighted), volume, match strength, verified employment.';

-- ----------------------------------------------------------------------------
-- 4) Recalc triggers: employment + matches + reference deletes
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trigger_trust_recalc_employment_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_trust_from_coworker_references(OLD.user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalculate_trust_from_coworker_references(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trust_recalc_employment_record ON public.employment_records;
CREATE TRIGGER trg_trust_recalc_employment_record
  AFTER INSERT OR DELETE OR UPDATE OF verification_status
  ON public.employment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_trust_recalc_employment_record();

CREATE OR REPLACE FUNCTION public.trigger_trust_recalc_employment_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT er.user_id INTO v_owner
    FROM public.employment_records er
    WHERE er.id = OLD.employment_record_id;
    IF v_owner IS NOT NULL THEN
      PERFORM public.recalculate_trust_from_coworker_references(v_owner);
    END IF;
    PERFORM public.recalculate_trust_from_coworker_references(OLD.matched_user_id);
    RETURN OLD;
  END IF;

  SELECT er.user_id INTO v_owner
  FROM public.employment_records er
  WHERE er.id = NEW.employment_record_id;

  IF v_owner IS NOT NULL THEN
    PERFORM public.recalculate_trust_from_coworker_references(v_owner);
  END IF;
  PERFORM public.recalculate_trust_from_coworker_references(NEW.matched_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trust_recalc_employment_match ON public.employment_matches;
CREATE TRIGGER trg_trust_recalc_employment_match
  AFTER INSERT OR UPDATE OF match_status OR DELETE
  ON public.employment_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_trust_recalc_employment_match();

CREATE OR REPLACE FUNCTION public.trigger_trust_recalc_coworker_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u1 UUID;
  u2 UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    u1 := OLD.user1_id;
    u2 := OLD.user2_id;
  ELSE
    u1 := NEW.user1_id;
    u2 := NEW.user2_id;
  END IF;

  IF u1 IS NOT NULL THEN
    PERFORM public.recalculate_trust_from_coworker_references(u1);
  END IF;
  IF u2 IS NOT NULL THEN
    PERFORM public.recalculate_trust_from_coworker_references(u2);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trust_recalc_coworker_match ON public.coworker_matches;
CREATE TRIGGER trg_trust_recalc_coworker_match
  AFTER INSERT OR DELETE OR UPDATE OF match_confidence, status
  ON public.coworker_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_trust_recalc_coworker_match();

-- Coworker references: DELETE should lower trust
CREATE OR REPLACE FUNCTION public.trigger_coworker_reference_trust()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_trust_from_coworker_references(OLD.reviewed_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalculate_trust_from_coworker_references(NEW.reviewed_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS coworker_reference_update_trust ON public.coworker_references;
CREATE TRIGGER coworker_reference_update_trust
  AFTER INSERT OR DELETE ON public.coworker_references
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_coworker_reference_trust();

-- Reference feedback: DELETE
CREATE OR REPLACE FUNCTION public.trigger_reference_feedback_trust()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_trust_from_coworker_references(OLD.target_user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalculate_trust_from_coworker_references(NEW.target_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reference_feedback_update_trust ON public.reference_feedback;
CREATE TRIGGER reference_feedback_update_trust
  AFTER INSERT OR DELETE ON public.reference_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_reference_feedback_trust();

-- Employment references (matched reviews)
CREATE OR REPLACE FUNCTION public.trigger_employment_reference_trust()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_trust_from_coworker_references(OLD.reviewed_user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalculate_trust_from_coworker_references(NEW.reviewed_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employment_reference_trust ON public.employment_references;
CREATE TRIGGER trg_employment_reference_trust
  AFTER INSERT OR DELETE ON public.employment_references
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_employment_reference_trust();

-- After deploy: optionally recompute all stored scores (run off-peak), e.g.:
-- SELECT public.recalculate_trust_from_coworker_references(p.id) FROM public.profiles p;
