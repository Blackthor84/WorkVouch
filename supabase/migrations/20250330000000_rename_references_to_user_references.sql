-- ============================================================================
-- Rename table "references" to "user_references"
-- "references" is a reserved keyword in PostgreSQL; user_references avoids
-- ambiguity and follows naming convention. All FKs, triggers, and RLS move with
-- the table. Index and function names updated for clarity.
-- Idempotent: only renames if public.references exists (skip if already user_references).
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'references') THEN
    ALTER TABLE public.references RENAME TO user_references;
  END IF;
END $$;

-- 2) Rename indexes (valid PostgreSQL; no reserved keywords; only if they exist)
ALTER INDEX IF EXISTS idx_references_from_user RENAME TO idx_user_references_from_user;
ALTER INDEX IF EXISTS idx_references_to_user RENAME TO idx_user_references_to_user;
ALTER INDEX IF EXISTS idx_references_job_id RENAME TO idx_user_references_job_id;
ALTER INDEX IF EXISTS idx_references_deleted RENAME TO idx_user_references_deleted;

-- 3) Update FK on notifications to point to user_references (constraint stays valid after rename; optional: rename constraint for clarity)
-- The column related_reference_id already references the renamed table. No ALTER needed.

-- 4) Trust score functions: use user_references and valid parameter names (p_user_id UUID)
CREATE OR REPLACE FUNCTION calculate_trust_score_v1(p_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_job_count INTEGER;
  v_reference_count INTEGER;
  v_avg_rating DECIMAL(3,2);
  v_score DECIMAL(5,2);
BEGIN
  SELECT COUNT(*) INTO v_job_count
  FROM public.jobs
  WHERE user_id = p_user_id AND is_private = false;

  SELECT COUNT(*) INTO v_reference_count
  FROM public.user_references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM public.user_references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  v_score := LEAST(v_job_count * 2, 30) +
             LEAST(v_reference_count, 40) +
             (v_avg_rating * 6);
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- 5) V2 trust score functions (from schema_v2_updates; replace all references to public.references)
CREATE OR REPLACE FUNCTION calculate_trust_score_v2(p_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_job_count INTEGER;
  v_reference_count INTEGER;
  v_avg_rating DECIMAL(3,2);
  v_high_rated_refs INTEGER;
  v_connection_count INTEGER;
  v_score DECIMAL(5,2);
BEGIN
  SELECT COUNT(*) INTO v_job_count
  FROM public.jobs
  WHERE user_id = p_user_id AND is_private = false;

  SELECT COUNT(*) INTO v_reference_count
  FROM public.user_references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM public.user_references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  SELECT COUNT(*) INTO v_high_rated_refs
  FROM public.user_references
  WHERE to_user_id = p_user_id AND is_deleted = false AND rating >= 4;

  SELECT COUNT(*) INTO v_connection_count
  FROM public.connections
  WHERE (user_id = p_user_id OR connected_user_id = p_user_id)
    AND status = 'confirmed';

  v_score := LEAST(v_job_count * 2, 25) +
             LEAST(v_reference_count, 35) +
             (v_avg_rating * 5) +
             LEAST(v_high_rated_refs * 0.5, 10) +
             LEAST(v_connection_count * 0.1, 5);
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_trust_score(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_score DECIMAL(5,2);
  v_job_count INTEGER;
  v_reference_count INTEGER;
  v_avg_rating DECIMAL(3,2);
BEGIN
  v_score := calculate_trust_score_v2(p_user_id);

  SELECT COUNT(*) INTO v_job_count
  FROM public.jobs
  WHERE user_id = p_user_id AND is_private = false;

  SELECT COUNT(*) INTO v_reference_count
  FROM public.user_references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM public.user_references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  INSERT INTO public.trust_scores (user_id, score, job_count, reference_count, average_rating, calculated_at, version)
  VALUES (p_user_id, v_score, v_job_count, v_reference_count, v_avg_rating, NOW(), 'v2')
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    job_count = EXCLUDED.job_count,
    reference_count = EXCLUDED.reference_count,
    average_rating = EXCLUDED.average_rating,
    calculated_at = NOW(),
    version = 'v2';
END;
$$ LANGUAGE plpgsql;

-- 6) Trigger for trust score on reference change (trigger stays on user_references after table rename)
-- Trigger update_trust_score_on_reference_change is already on the renamed table. Recreate to use correct table name in trigger name if desired:
DROP TRIGGER IF EXISTS update_trust_score_on_reference_change ON public.user_references;
CREATE TRIGGER update_trust_score_on_reference_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_references
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_trust_score_on_reference();

-- 7) Notify trigger (moved with table; ensure it exists on user_references)
DROP TRIGGER IF EXISTS notify_on_reference_created ON public.user_references;
CREATE TRIGGER notify_on_reference_created
  AFTER INSERT ON public.user_references
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_reference_created();

COMMENT ON TABLE public.user_references IS 'Peer references (from_user_id, to_user_id, job_id). Renamed from references to avoid reserved keyword.';
