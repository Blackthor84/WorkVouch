-- ============================================================================
-- Enterprise Admin Governance: user_activity_log, system_settings, fraud/anomaly
-- ============================================================================

-- user_activity_log: full event history per user (Phase 5)
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON public.user_activity_log(type);

COMMENT ON TABLE public.user_activity_log IS 'Full event history per user for forensics and timeline.';

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own activity log" ON public.user_activity_log;
CREATE POLICY "Users can select own activity log"
  ON public.user_activity_log FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can select all user_activity_log" ON public.user_activity_log;
CREATE POLICY "Admins can select all user_activity_log"
  ON public.user_activity_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Only service role / backend inserts (no INSERT policy for authenticated)
-- ============================================================================

-- system_settings: key-value for maintenance mode and feature toggles (Phase 9)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.system_settings IS 'System-wide settings: maintenance_mode, intelligence_version, etc.';

INSERT INTO public.system_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "block_signups": true, "block_reviews": true, "block_employment": true, "banner_message": "System maintenance in progress."}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select system_settings" ON public.system_settings;
CREATE POLICY "Admins can select system_settings"
  ON public.system_settings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Superadmin can update system_settings" ON public.system_settings;
CREATE POLICY "Superadmin can update system_settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ============================================================================
-- fraud_signals: store fraud detection events for dashboard (Phase 3 / 11)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_user_id ON public.fraud_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_created_at ON public.fraud_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_signal_type ON public.fraud_signals(signal_type);

COMMENT ON TABLE public.fraud_signals IS 'Fraud detection events: self_review_blocked, duplicate_review, rapid_velocity, etc.';

ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select fraud_signals" ON public.fraud_signals;
CREATE POLICY "Admins can select fraud_signals"
  ON public.fraud_signals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Inserts from backend/service role only
-- ============================================================================
-- anomaly_alerts: alert engine output (Phase 11)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_user_id ON public.anomaly_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_created_at ON public.anomaly_alerts(created_at DESC);

COMMENT ON TABLE public.anomaly_alerts IS 'Anomaly alert engine: rapid reviews, sentiment shift, overlap failures, etc.';

ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select anomaly_alerts" ON public.anomaly_alerts;
CREATE POLICY "Admins can select anomaly_alerts"
  ON public.anomaly_alerts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- ============================================================================
-- admin_audit_logs: add ip_address if not present (Phase 12)
-- ============================================================================
ALTER TABLE public.admin_audit_logs
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;
