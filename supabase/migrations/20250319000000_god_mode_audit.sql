-- ============================================================================
-- God Mode audit: every Superadmin God Mode action. Append-only, SOC-2.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.god_mode_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id UUID NOT NULL,
  superadmin_email TEXT,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_identifier TEXT,
  reason TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('production', 'sandbox')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_god_mode_audit_superadmin_id ON public.god_mode_audit(superadmin_id);
CREATE INDEX IF NOT EXISTS idx_god_mode_audit_action ON public.god_mode_audit(action);
CREATE INDEX IF NOT EXISTS idx_god_mode_audit_created_at ON public.god_mode_audit(created_at DESC);

COMMENT ON TABLE public.god_mode_audit IS 'SOC-2: Every Superadmin God Mode action. Append-only. No UPDATE/DELETE.';
ALTER TABLE public.god_mode_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only god_mode_audit" ON public.god_mode_audit;
CREATE POLICY "Service role only god_mode_audit" ON public.god_mode_audit FOR ALL USING (false);

REVOKE UPDATE ON public.god_mode_audit FROM PUBLIC;
REVOKE DELETE ON public.god_mode_audit FROM PUBLIC;
