-- ============================================================================
-- Plan limits table, organization_usage monthly_checks/last_reset,
-- organization_metrics for limit_block, organizations.enterprise_features
-- Additive only. No destructive changes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) PLAN_LIMITS: per-plan caps (fallback when not in DB: use app constants)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key TEXT NOT NULL UNIQUE,
  max_locations INTEGER NOT NULL DEFAULT 1,
  max_admins INTEGER NOT NULL DEFAULT 2,
  max_monthly_checks INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_limits_plan_key ON public.plan_limits(plan_key);

INSERT INTO public.plan_limits (plan_key, max_locations, max_admins, max_monthly_checks, updated_at)
VALUES
  ('starter', 1, 2, 25, NOW()),
  ('growth', 3, 5, 100, NOW()),
  ('professional', 3, 5, 100, NOW()),
  ('enterprise', -1, -1, -1, NOW()),
  ('custom', -1, -1, -1, NOW())
ON CONFLICT (plan_key) DO UPDATE SET
  max_locations = EXCLUDED.max_locations,
  max_admins = EXCLUDED.max_admins,
  max_monthly_checks = EXCLUDED.max_monthly_checks,
  updated_at = EXCLUDED.updated_at;

COMMENT ON TABLE public.plan_limits IS 'Per-plan limits; -1 = unlimited. Used by checkOrgLimits.';

-- ----------------------------------------------------------------------------
-- 2) ORGANIZATION_USAGE: add monthly_checks and last_reset
-- ----------------------------------------------------------------------------
ALTER TABLE public.organization_usage
  ADD COLUMN IF NOT EXISTS monthly_checks INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reset TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.organization_usage.monthly_checks IS 'Checks consumed this period; reset when last_reset > 30 days.';
COMMENT ON COLUMN public.organization_usage.last_reset IS 'When monthly_checks was last reset.';

-- ----------------------------------------------------------------------------
-- 3) ORGANIZATION_METRICS: audit log for limit blocks and usage
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_metrics_org ON public.organization_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_metrics_name ON public.organization_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_organization_metrics_created ON public.organization_metrics(created_at DESC);

COMMENT ON TABLE public.organization_metrics IS 'Audit/metrics per org; e.g. limit_block.';

-- ----------------------------------------------------------------------------
-- 4) ORGANIZATIONS: enterprise_features JSONB for multi_property etc.
-- ----------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS enterprise_features JSONB DEFAULT '{}';

COMMENT ON COLUMN public.organizations.enterprise_features IS 'Feature flags e.g. { "multi_property": true }; skip location cap when set.';

-- ----------------------------------------------------------------------------
-- 5) RLS for plan_limits (read by service role / app), organization_metrics
-- ----------------------------------------------------------------------------
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role plan_limits" ON public.plan_limits;
CREATE POLICY "Service role plan_limits"
  ON public.plan_limits FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role organization_metrics" ON public.organization_metrics;
CREATE POLICY "Service role organization_metrics"
  ON public.organization_metrics FOR ALL
  USING (true)
  WITH CHECK (true);
