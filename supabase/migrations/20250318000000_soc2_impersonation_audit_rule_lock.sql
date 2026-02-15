-- ============================================================================
-- SOC-2: Impersonation audit + lock audit logs + rule version immutability
-- ============================================================================

-- 1. Impersonation audit — every start/end of impersonation (admin or sandbox)
CREATE TABLE IF NOT EXISTS public.impersonation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  admin_email TEXT,
  target_user_id UUID,
  target_identifier TEXT,
  event TEXT NOT NULL CHECK (event IN ('start', 'end')),
  environment TEXT NOT NULL CHECK (environment IN ('production', 'sandbox')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impersonation_audit_admin_user_id ON public.impersonation_audit(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_target_user_id ON public.impersonation_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_event ON public.impersonation_audit(event);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_environment ON public.impersonation_audit(environment);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_created_at ON public.impersonation_audit(created_at DESC);

COMMENT ON TABLE public.impersonation_audit IS 'SOC-2: Every impersonation start/end. Append-only. Admin + target + environment.';
ALTER TABLE public.impersonation_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only impersonation_audit" ON public.impersonation_audit;
CREATE POLICY "Service role only impersonation_audit" ON public.impersonation_audit FOR ALL USING (false);

REVOKE UPDATE ON public.impersonation_audit FROM PUBLIC;
REVOKE DELETE ON public.impersonation_audit FROM PUBLIC;

-- 2. Lock audit_logs (append-only, non-editable)
REVOKE UPDATE ON public.audit_logs FROM PUBLIC;
REVOKE DELETE ON public.audit_logs FROM PUBLIC;
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail. Insert only. No UPDATE/DELETE.';

-- 3. Rule versions: never delete old versions (sandbox_rule_versions)
REVOKE DELETE ON public.sandbox_rule_versions FROM PUBLIC;
COMMENT ON TABLE public.sandbox_rule_versions IS 'Immutable rule versions. On change: insert new version, deactivate previous. Never delete.';
