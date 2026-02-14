-- ============================================================================
-- Audit logs: admin_role + is_sandbox for enterprise admin governance
-- WHY: Every admin action must be logged with who (admin_id), what role they had,
--      and whether the action was in sandbox (never touch production).
-- ============================================================================

ALTER TABLE public.admin_audit_logs
  ADD COLUMN IF NOT EXISTS admin_role TEXT,
  ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.admin_audit_logs.admin_role IS 'Role of admin at time of action: admin | superadmin. Immutable audit trail.';
COMMENT ON COLUMN public.admin_audit_logs.is_sandbox IS 'True if action was performed in sandbox mode; sandbox must never affect production rows.';

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_role ON public.admin_audit_logs(admin_role);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_is_sandbox ON public.admin_audit_logs(is_sandbox);
