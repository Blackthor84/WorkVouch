-- Reference feedback: rating + feedback when a reference request is accepted (coworker flow)
-- Links to reference_requests; updates trust_scores for target_user_id
CREATE TABLE IF NOT EXISTS public.reference_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.reference_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reference_feedback_no_self CHECK (author_id != target_user_id),
  CONSTRAINT reference_feedback_unique_request UNIQUE (request_id)
);

CREATE INDEX IF NOT EXISTS idx_reference_feedback_target ON public.reference_feedback(target_user_id);
CREATE INDEX IF NOT EXISTS idx_reference_feedback_author ON public.reference_feedback(author_id);
CREATE INDEX IF NOT EXISTS idx_reference_feedback_request ON public.reference_feedback(request_id);

ALTER TABLE public.reference_feedback ENABLE ROW LEVEL SECURITY;

-- Authors can insert their own feedback (receiver of the request leaving feedback for requester)
CREATE POLICY "Authors can insert own reference feedback"
  ON public.reference_feedback FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can view feedback they gave or received
CREATE POLICY "Users can view reference feedback they are part of"
  ON public.reference_feedback FOR SELECT
  USING (auth.uid() = author_id OR auth.uid() = target_user_id);

-- Ensure trust_scores has columns we need (reference_count exists; add total_references if desired — we use reference_count)
-- Recalculate trust for a user from reference_feedback: score = avg(rating)*20 (0-100), reference_count = count
CREATE OR REPLACE FUNCTION public.recalculate_trust_from_peer_references(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_count INT;
  v_score NUMERIC;
BEGIN
  SELECT COALESCE(AVG(rating)::NUMERIC, 0), COALESCE(COUNT(*)::INT, 0)
  INTO v_avg_rating, v_count
  FROM reference_feedback
  WHERE target_user_id = p_user_id;

  -- Score 0-100 from 1-5 rating scale
  v_score := LEAST(100, GREATEST(0, (v_avg_rating * 20.0)));

  INSERT INTO public.trust_scores (user_id, score, reference_count, average_rating, calculated_at, version)
  VALUES (p_user_id, v_score, v_count, v_avg_rating, NOW(), 'v2')
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    reference_count = GREATEST(COALESCE(trust_scores.reference_count, 0), EXCLUDED.reference_count),
    average_rating = CASE WHEN EXCLUDED.reference_count > 0 THEN EXCLUDED.average_rating ELSE trust_scores.average_rating END,
    calculated_at = NOW();
END;
$$;

-- Trigger: when reference_feedback is inserted, update trust_scores for target_user_id
CREATE OR REPLACE FUNCTION public.trigger_reference_feedback_trust()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM recalculate_trust_from_peer_references(NEW.target_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reference_feedback_update_trust ON public.reference_feedback;
CREATE TRIGGER reference_feedback_update_trust
  AFTER INSERT ON public.reference_feedback
  FOR EACH ROW
  EXECUTE FUNCTION trigger_reference_feedback_trust();

COMMENT ON TABLE public.reference_feedback IS 'Peer reference feedback (rating + text) from accepted reference_requests. Drives trust_scores for target user.';
