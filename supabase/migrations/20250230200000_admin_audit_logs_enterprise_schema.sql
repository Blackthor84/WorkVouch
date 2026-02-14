-- ============================================================================
-- ENTERPRISE ADMIN AUDIT LOGS — Exact schema per spec. Immutable. Fail-closed.
-- If an admin action cannot write to this table, THE ACTION MUST FAIL.
-- REVOKE UPDATE/DELETE so logs cannot be edited or deleted.
-- ============================================================================

-- If table does not exist, create with exact spec (greenfield).
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  admin_email TEXT,
  admin_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  before_state JSONB,
  after_state JSONB,
  reason TEXT NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- If table already existed with old schema, the following ALTERs add/rename columns.
-- If we just created it above, most ALTERs will add columns that already exist (no-op with IF NOT EXISTS) or fail on RENAME; so we only run ALTERs when the table has the old column names.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'admin_id') THEN
    -- Add new columns (before renames)
    ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS admin_email TEXT;
    ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS target_type TEXT;
    ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS target_id UUID;
    UPDATE public.admin_audit_logs SET target_type = COALESCE(target_type, 'user'), target_id = COALESCE(target_id, target_user_id), reason = COALESCE(reason, ''), admin_role = COALESCE(admin_role, 'admin') WHERE target_type IS NULL OR target_id IS NULL OR reason IS NULL OR admin_role IS NULL;
    ALTER TABLE public.admin_audit_logs ALTER COLUMN reason SET DEFAULT '';
    ALTER TABLE public.admin_audit_logs ALTER COLUMN admin_role SET DEFAULT 'admin';
    UPDATE public.admin_audit_logs SET reason = '' WHERE reason IS NULL;
    UPDATE public.admin_audit_logs SET admin_role = 'admin' WHERE admin_role IS NULL;
    ALTER TABLE public.admin_audit_logs ALTER COLUMN reason SET NOT NULL;
    ALTER TABLE public.admin_audit_logs ALTER COLUMN admin_role SET NOT NULL;
    ALTER TABLE public.admin_audit_logs ALTER COLUMN target_type SET NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND constraint_name = 'admin_audit_logs_admin_id_fkey') THEN
      ALTER TABLE public.admin_audit_logs DROP CONSTRAINT admin_audit_logs_admin_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND constraint_name = 'admin_audit_logs_target_user_id_fkey') THEN
      ALTER TABLE public.admin_audit_logs DROP CONSTRAINT admin_audit_logs_target_user_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND constraint_name = 'admin_audit_logs_organization_id_fkey') THEN
      ALTER TABLE public.admin_audit_logs DROP CONSTRAINT admin_audit_logs_organization_id_fkey;
    END IF;
    ALTER TABLE public.admin_audit_logs RENAME COLUMN admin_id TO admin_user_id;
    ALTER TABLE public.admin_audit_logs RENAME COLUMN action TO action_type;
    ALTER TABLE public.admin_audit_logs RENAME COLUMN old_value TO before_state;
    ALTER TABLE public.admin_audit_logs RENAME COLUMN new_value TO after_state;
    ALTER TABLE public.admin_audit_logs DROP COLUMN IF EXISTS target_user_id;
    ALTER TABLE public.admin_audit_logs DROP COLUMN IF EXISTS organization_id;
  END IF;
END $$;

-- Indexes for filters
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_type ON public.admin_audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Immutable: no updates or deletes. Logs cannot be edited or deleted.
REVOKE UPDATE ON public.admin_audit_logs FROM PUBLIC;
REVOKE DELETE ON public.admin_audit_logs FROM PUBLIC;

COMMENT ON TABLE public.admin_audit_logs IS 'Enterprise admin audit trail. Every admin action MUST write here. If insert fails, action must fail. Immutable (no UPDATE/DELETE).';
