-- ============================================================================
-- Trust Forecasting: SQL function from trust_events only
-- Industry Benchmarks: aggregation table (nightly job populates from trust_scores)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) forecast_trust_trajectory(profile_id uuid, has_unresolved_dispute boolean)
--    Uses trust_events only for impact sums; dispute flag from API layer.
--    Returns: trajectory text, recent_impact, previous_impact
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.forecast_trust_trajectory(
  p_profile_id UUID,
  p_has_unresolved_dispute BOOLEAN DEFAULT false
)
RETURNS TABLE (
  trajectory TEXT,
  recent_impact NUMERIC,
  previous_impact NUMERIC,
  recent_event_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_impact NUMERIC := 0;
  v_previous_impact NUMERIC := 0;
  v_recent_count BIGINT := 0;
  v_trajectory TEXT := 'stable';
  v_diff NUMERIC;
BEGIN
  -- Sum impact_score last 30 days
  SELECT COALESCE(SUM(te.impact_score), 0), COUNT(*)
  INTO v_recent_impact, v_recent_count
  FROM public.trust_events te
  WHERE te.profile_id = p_profile_id
    AND te.created_at >= (NOW() - INTERVAL '30 days');

  -- Sum impact_score days 31-60
  SELECT COALESCE(SUM(te.impact_score), 0)
  INTO v_previous_impact
  FROM public.trust_events te
  WHERE te.profile_id = p_profile_id
    AND te.created_at >= (NOW() - INTERVAL '60 days')
    AND te.created_at < (NOW() - INTERVAL '30 days');

  -- Rules (explainable)
  IF p_has_unresolved_dispute THEN
    v_trajectory := 'at_risk';
  ELSIF v_recent_impact > v_previous_impact THEN
    v_trajectory := 'improving';
  ELSE
    v_diff := ABS(v_recent_impact - v_previous_impact);
    IF v_diff < 5 THEN
      v_trajectory := 'stable';
    ELSE
      v_trajectory := 'at_risk';
    END IF;
  END IF;

  trajectory := v_trajectory;
  recent_impact := v_recent_impact;
  previous_impact := v_previous_impact;
  recent_event_count := v_recent_count;
  RETURN NEXT;
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.forecast_trust_trajectory IS 'Trust forecast from trust_events only. recent_impact=sum last 30d, previous_impact=sum 31-60d. Dispute flag from API.';

-- ----------------------------------------------------------------------------
-- 2) trust_industry_benchmarks — industry avg and top 10% (nightly aggregation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trust_industry_benchmarks (
  industry TEXT NOT NULL PRIMARY KEY,
  avg_score NUMERIC NOT NULL DEFAULT 0,
  top_10_percent NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_industry_benchmarks_updated
  ON public.trust_industry_benchmarks(updated_at DESC);

COMMENT ON TABLE public.trust_industry_benchmarks IS 'Industry trust benchmarks: avg and 90th percentile from stored trust_scores. Updated nightly.';

ALTER TABLE public.trust_industry_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role trust_industry_benchmarks" ON public.trust_industry_benchmarks;
CREATE POLICY "Service role trust_industry_benchmarks"
  ON public.trust_industry_benchmarks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated read for own industry comparison (API uses service role)
DROP POLICY IF EXISTS "Authenticated read trust_industry_benchmarks" ON public.trust_industry_benchmarks;
CREATE POLICY "Authenticated read trust_industry_benchmarks"
  ON public.trust_industry_benchmarks FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 3) RPC for nightly aggregation: compute from trust_scores + industry source
--    Industry from employee_profiles.industry, else profiles.industry; score from trust_scores
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aggregate_trust_industry_benchmarks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_industry TEXT;
  v_avg NUMERIC;
  v_p90 NUMERIC;
BEGIN
  FOR r IN
    SELECT
      COALESCE(ep.industry, p.industry, 'Unknown') AS industry,
      AVG(COALESCE(ts.score, 0)::NUMERIC) AS avg_score,
      PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY COALESCE(ts.score, 0)::NUMERIC) AS p90
    FROM public.profiles p
    LEFT JOIN public.employee_profiles ep ON ep.profile_id = p.id
    LEFT JOIN public.trust_scores ts ON ts.user_id = p.id
    WHERE (p.role IS NULL OR p.role IN ('user', 'employee'))
      AND (COALESCE(ep.industry, p.industry) IS NOT NULL AND TRIM(COALESCE(ep.industry, p.industry)) <> '')
    GROUP BY COALESCE(ep.industry, p.industry)
  LOOP
    v_industry := NULLIF(TRIM(r.industry), '');
    IF v_industry IS NULL THEN
      v_industry := 'Unknown';
    END IF;
    v_avg := COALESCE(r.avg_score, 0);
    v_p90 := COALESCE(r.p90, 0);
    INSERT INTO public.trust_industry_benchmarks (industry, avg_score, top_10_percent, updated_at)
    VALUES (v_industry, v_avg, v_p90, NOW())
    ON CONFLICT (industry) DO UPDATE SET
      avg_score = EXCLUDED.avg_score,
      top_10_percent = EXCLUDED.top_10_percent,
      updated_at = EXCLUDED.updated_at;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.aggregate_trust_industry_benchmarks IS 'Nightly: aggregate trust_scores by industry into trust_industry_benchmarks. Do not recompute from trust_events.';

-- Index for benchmark aggregation and percentile queries (Section 13)
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON public.profiles(industry) WHERE industry IS NOT NULL;
