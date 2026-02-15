-- ============================================================================
-- FRAUD STRESS-TEST PLAYBOOK — Automated run with report. Exportable. Sandbox-only.
-- Why: Measure detection latency, trust inflation before containment, % auto-mitigated, manual intervention.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sandbox_stress_test_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL,
  scale_config JSONB NOT NULL DEFAULT '{}',
  duration_seconds INT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  report JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_stress_test_reports_sandbox_id ON public.sandbox_stress_test_reports(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_stress_test_reports_scenario ON public.sandbox_stress_test_reports(scenario);
CREATE INDEX IF NOT EXISTS idx_sandbox_stress_test_reports_created_at ON public.sandbox_stress_test_reports(created_at DESC);

COMMENT ON TABLE public.sandbox_stress_test_reports IS 'Fraud stress-test playbook runs. Report: detection_latency_ms, trust_inflation_before_containment, pct_auto_mitigated, manual_intervention_count. Exportable.';

ALTER TABLE public.sandbox_stress_test_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only sandbox_stress_test_reports" ON public.sandbox_stress_test_reports;
CREATE POLICY "Service role only sandbox_stress_test_reports" ON public.sandbox_stress_test_reports FOR ALL USING (false);
