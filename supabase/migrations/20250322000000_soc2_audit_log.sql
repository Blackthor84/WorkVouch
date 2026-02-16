-- ============================================================================
-- SOC2 minimal audit log — tamper-resistant, append-only.
-- For: admin access, analytics access, sensitive operations.
-- NEVER log: location values, IP addresses, user names/emails, raw request bodies.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.soc2_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soc2_audit_log_action ON public.soc2_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_soc2_audit_log_resource ON public.soc2_audit_log(resource);
CREATE INDEX IF NOT EXISTS idx_soc2_audit_log_created_at ON public.soc2_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_soc2_audit_log_actor_id ON public.soc2_audit_log(actor_id);

COMMENT ON TABLE public.soc2_audit_log IS 'SOC2 minimal audit: action + resource only. No location, IP, PII. Immutable. Append-only.';

REVOKE UPDATE ON public.soc2_audit_log FROM PUBLIC;
REVOKE DELETE ON public.soc2_audit_log FROM PUBLIC;

ALTER TABLE public.soc2_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only for soc2_audit_log" ON public.soc2_audit_log FOR ALL USING (false);
