-- Production Hardening: full system_audit_logs schema, intelligence_history breakdown, constraints check.
-- ============================================================================

-- 1) system_audit_logs: add full traceability columns (keep existing for backward compat)
ALTER TABLE public.system_audit_logs
  ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_role TEXT,
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_system_audit_logs_action ON public.system_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_actor_user_id ON public.system_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_target_user_id ON public.system_audit_logs(target_user_id);

COMMENT ON COLUMN public.system_audit_logs.actor_user_id IS 'User who performed the action';
COMMENT ON COLUMN public.system_audit_logs.action IS 'Action type: admin_edit, role_change, email_change, profile_delete, fraud_block, dispute_resolve, employment_confirm, intel_recalc, stripe_plan_change, etc.';

-- 2) intelligence_history: add breakdown_json for graphs and transparency
ALTER TABLE public.intelligence_history
  ADD COLUMN IF NOT EXISTS breakdown_json JSONB;

COMMENT ON COLUMN public.intelligence_history.breakdown_json IS 'Component breakdown at recalculation time for defensibility and graphs';

-- 3) Ensure employment_references: no self-review (already in 20250129000002)
-- CONSTRAINT employment_references_no_self CHECK (reviewer_id != reviewed_user_id)
-- UNIQUE (employment_match_id, reviewer_id) - duplicate review prevented

-- 4) Ensure profiles.status and deleted_at exist for soft delete
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- (intelligence_history.reason enum already exists for change_reason semantics)
