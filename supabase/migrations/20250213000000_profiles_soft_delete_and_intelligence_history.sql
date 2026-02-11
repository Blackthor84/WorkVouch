-- ============================================================================
-- Profiles: is_deleted for user-initiated soft delete (idempotent)
-- intelligence_history: audit log for every trust score recalculation
-- ============================================================================

-- profiles: is_deleted (deleted_at already added in admin_user_management)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
COMMENT ON COLUMN public.profiles.is_deleted IS 'User-initiated or admin soft delete; purge after 30 days when true.';

CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted_deleted_at
  ON public.profiles(is_deleted, deleted_at) WHERE is_deleted = true;

-- ============================================================================
-- intelligence_history: one row per trust score recalculation (versioned, reason)
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE intelligence_history_reason AS ENUM (
    'peer_review_added',
    'employment_verified',
    'dispute_resolved',
    'cron_recalc',
    'manual_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.intelligence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_score NUMERIC,
  new_score NUMERIC NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1',
  reason intelligence_history_reason NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_history_user_id ON public.intelligence_history(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_history_created_at ON public.intelligence_history(created_at DESC);

COMMENT ON TABLE public.intelligence_history IS 'Audit log: one row per trust score recalculation; version and reason for defensibility.';

ALTER TABLE public.intelligence_history ENABLE ROW LEVEL SECURITY;

-- Only service role / backend inserts; admins can read
DROP POLICY IF EXISTS "Admins can select intelligence_history" ON public.intelligence_history;
CREATE POLICY "Admins can select intelligence_history"
  ON public.intelligence_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
