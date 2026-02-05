-- ============================================================================
-- SANDBOX V2 — Template registry + session summary (auto metrics)
-- ============================================================================

-- Template registry: preset industry profiles for one-click population
CREATE TABLE IF NOT EXISTS public.sandbox_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  default_employee_count INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_templates_template_key ON public.sandbox_templates(template_key);

INSERT INTO public.sandbox_templates (template_key, display_name, industry, default_employee_count, description)
VALUES
  ('security_agency', 'Security Agency – Mid Size', 'Security', 85, 'High verification, moderate turnover, strong rehire patterns'),
  ('healthcare_network', 'Healthcare Network', 'Healthcare', 140, 'Long tenure, high compliance, low dispute rate'),
  ('tech_startup', 'Tech Startup – Series B', 'Technology', 60, 'Short tenure, high peer interaction, high volatility'),
  ('enterprise_corp', 'Fortune 500 Enterprise', 'Corporate', 300, 'Layered departments, stable tenure, high network density'),
  ('logistics_group', 'Logistics & Transportation', 'Logistics', 110, 'Mixed tenure, moderate disputes, regional structure'),
  ('hospitality_chain', 'Hospitality Brand', 'Hospitality', 120, 'High churn, strong internal referrals')
ON CONFLICT (template_key) DO NOTHING;

-- Session summary: auto-calculated after template deploy or recalc (future-proof metric names)
CREATE TABLE IF NOT EXISTS public.sandbox_session_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  avg_profile_strength NUMERIC,
  avg_career_health NUMERIC,
  avg_risk_index NUMERIC,
  hiring_confidence_mean NUMERIC,
  network_density NUMERIC,
  revenue_projection NUMERIC,
  ad_roi NUMERIC,
  data_density_index INT,
  demo_mode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow upsert to refresh updated_at
CREATE OR REPLACE FUNCTION public.sandbox_session_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sandbox_session_summary_updated ON public.sandbox_session_summary;
CREATE TRIGGER sandbox_session_summary_updated
  BEFORE UPDATE ON public.sandbox_session_summary
  FOR EACH ROW EXECUTE PROCEDURE public.sandbox_session_summary_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS sandbox_session_summary_sandbox_key ON public.sandbox_session_summary(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_session_summary_sandbox_id ON public.sandbox_session_summary(sandbox_id);

COMMENT ON TABLE public.sandbox_templates IS 'Preset sandbox templates for one-click population.';
COMMENT ON TABLE public.sandbox_session_summary IS 'Auto-calculated metrics per session; demo_mode alters display.';
