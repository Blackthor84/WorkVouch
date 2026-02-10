-- ============================================================================
-- Admin User Management: profiles admin fields + admin_audit_logs
-- ============================================================================

-- Enums for profile admin fields
DO $$ BEGIN
  CREATE TYPE profile_status_enum AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE profile_risk_level_enum AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add admin fields to profiles (if not present)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status profile_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS risk_level profile_risk_level_enum NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS flagged_for_fraud BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.status IS 'Admin-controlled: active, suspended, deleted.';
COMMENT ON COLUMN public.profiles.risk_level IS 'Admin-assessed risk: low, medium, high.';
COMMENT ON COLUMN public.profiles.flagged_for_fraud IS 'Admin flag for fraud review.';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Soft delete timestamp; null = not deleted.';

-- admin_audit_logs: record all admin actions on users
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id ON public.admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

COMMENT ON TABLE public.admin_audit_logs IS 'Audit trail for admin actions on user accounts.';

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs (enforced in API with service role for writes)
DROP POLICY IF EXISTS "Admins can select admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can select admin_audit_logs"
  ON public.admin_audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Inserts/updates typically done via service role in API (bypass RLS)
DROP POLICY IF EXISTS "Admins can insert admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert admin_audit_logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (admin_id = auth.uid());
