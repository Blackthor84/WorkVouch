-- ============================================================================
-- INCIDENT REPORTING AND RESPONSE — Automated, structured, auditable.
-- Incidents are immutable records. Sandbox and production strictly separated.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- incidents — one row per incident (created automatically or from alerts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  environment TEXT NOT NULL CHECK (environment IN ('prod', 'sandbox')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mitigated', 'resolved')),

  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mitigated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  triggered_by TEXT,
  related_alert_ids UUID[] DEFAULT '{}'::UUID[],

  affected_users INTEGER,
  affected_employers INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_environment_status ON public.incidents(environment, status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON public.incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);

COMMENT ON TABLE public.incidents IS 'Automated incident records. Immutable. Sandbox vs prod by environment.';

-- ---------------------------------------------------------------------------
-- incident_actions — every action on an incident (admin or automated)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  admin_user_id UUID,
  admin_role TEXT,

  action_type TEXT NOT NULL,
  action_metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_actions_incident_id ON public.incident_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_actions_created_at ON public.incident_actions(created_at DESC);

COMMENT ON TABLE public.incident_actions IS 'Audit trail for incident lifecycle and admin actions.';

-- ---------------------------------------------------------------------------
-- RLS: service role only
-- ---------------------------------------------------------------------------
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only for incidents" ON public.incidents;
CREATE POLICY "Service role only for incidents" ON public.incidents FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only for incident_actions" ON public.incident_actions;
CREATE POLICY "Service role only for incident_actions" ON public.incident_actions FOR ALL USING (false);
