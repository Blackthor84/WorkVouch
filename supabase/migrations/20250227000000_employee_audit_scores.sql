-- ============================================================================
-- employee_audit_scores: 100-point explainable audit score per user
-- (Identity, Work history, Reference strength, Skill credibility, Risk)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employee_audit_scores (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score >= 0 AND score <= 100),
  band TEXT NOT NULL CHECK (band IN ('highly_verified', 'verified', 'partially_verified', 'unverified')),
  breakdown JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.employee_audit_scores IS 'Server-side employee audit score (0-100) and explainable breakdown; used for ranking and admin/employer display.';
CREATE INDEX IF NOT EXISTS idx_employee_audit_scores_calculated_at ON public.employee_audit_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_audit_scores_band ON public.employee_audit_scores(band);
CREATE INDEX IF NOT EXISTS idx_employee_audit_scores_score ON public.employee_audit_scores(score DESC);

-- RLS: service role only (server-side calculation)
ALTER TABLE public.employee_audit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access employee_audit_scores"
  ON public.employee_audit_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
