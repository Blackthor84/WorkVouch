-- ============================================================================
-- ADMIN ALERTS — Real-time alerting and notification system.
-- Sandbox and production strictly separated (is_sandbox). All actions auditable.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- admin_alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  category TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  recommended_action TEXT,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,

  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'acknowledged', 'dismissed', 'escalated')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  dismissed_by UUID,
  dismissed_at TIMESTAMPTZ,
  silenced_until TIMESTAMPTZ,
  escalation_count INT NOT NULL DEFAULT 0,

  source_ref JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_is_sandbox_created_at ON public.admin_alerts(is_sandbox, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_status_sandbox ON public.admin_alerts(status, is_sandbox);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity_sandbox ON public.admin_alerts(severity, is_sandbox);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_category ON public.admin_alerts(category);

COMMENT ON TABLE public.admin_alerts IS 'Admin alerts. Sandbox vs prod by is_sandbox. Severity: info, warning, critical.';

-- ---------------------------------------------------------------------------
-- admin_alert_deliveries — delivery audit and retry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_alert_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.admin_alerts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  recipient TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_alert_deliveries_alert_id ON public.admin_alert_deliveries(alert_id);

COMMENT ON TABLE public.admin_alert_deliveries IS 'Alert delivery log: in_app, email, slack. Used for audit and failure handling.';

-- ---------------------------------------------------------------------------
-- RLS: service role only (admin UI and server-side code use service role)
-- ---------------------------------------------------------------------------
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alert_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only for admin_alerts" ON public.admin_alerts;
CREATE POLICY "Service role only for admin_alerts" ON public.admin_alerts FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only for admin_alert_deliveries" ON public.admin_alert_deliveries;
CREATE POLICY "Service role only for admin_alert_deliveries" ON public.admin_alert_deliveries FOR ALL USING (false);
