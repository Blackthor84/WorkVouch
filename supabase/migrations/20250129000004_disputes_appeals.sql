-- ============================================================================
-- DISPUTE & APPEALS SYSTEM (Production)
-- Integrates with: profiles, employment_records, employment_references,
-- fraud_flags, trust_scores, rehire_logs. user_id = profiles(id).
-- ============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE dispute_type_enum AS ENUM (
    'employment',
    'reference',
    'fraud_flag',
    'trust_score',
    'rehire_status'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status_enum AS ENUM (
    'open',
    'under_review',
    'resolved',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appeal_status_enum AS ENUM (
    'pending',
    'reviewed',
    'approved',
    'denied'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dispute_action_type_enum AS ENUM (
    'modify_record',
    'remove_flag',
    'restore_score',
    'confirm_original',
    'reverse_rehire_status'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- disputes: user-initiated (one open per related_record_id)
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dispute_type dispute_type_enum NOT NULL,
  related_record_id UUID NOT NULL,
  description TEXT NOT NULL,
  status dispute_status_enum NOT NULL DEFAULT 'open',
  resolution_summary TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_one_open_per_record
  ON public.disputes (related_record_id, dispute_type)
  WHERE status IN ('open', 'under_review');

CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON public.disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON public.disputes(created_at DESC);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own disputes" ON public.disputes;
CREATE POLICY "Users see own disputes"
  ON public.disputes FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own disputes" ON public.disputes;
CREATE POLICY "Users insert own disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins see all disputes" ON public.disputes;
CREATE POLICY "Admins see all disputes"
  ON public.disputes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Only admins update dispute status" ON public.disputes;
CREATE POLICY "Only admins update dispute status"
  ON public.disputes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
  WITH CHECK (true);

-- dispute_evidence
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id ON public.dispute_evidence(dispute_id);

ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see evidence for own disputes" ON public.dispute_evidence;
CREATE POLICY "Users see evidence for own disputes"
  ON public.dispute_evidence FOR SELECT
  USING (
    dispute_id IN (SELECT id FROM public.disputes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users upload evidence for own disputes" ON public.dispute_evidence;
CREATE POLICY "Users upload evidence for own disputes"
  ON public.dispute_evidence FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND dispute_id IN (SELECT id FROM public.disputes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins see all dispute_evidence" ON public.dispute_evidence;
CREATE POLICY "Admins see all dispute_evidence"
  ON public.dispute_evidence FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- appeals: one per dispute, only when dispute resolved/rejected
CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  status appeal_status_enum NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT appeals_one_per_dispute UNIQUE (dispute_id)
);

CREATE INDEX IF NOT EXISTS idx_appeals_dispute_id ON public.appeals(dispute_id);
CREATE INDEX IF NOT EXISTS idx_appeals_user_id ON public.appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status);

ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own appeals" ON public.appeals;
CREATE POLICY "Users see own appeals"
  ON public.appeals FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create appeal for own dispute" ON public.appeals;
CREATE POLICY "Users create appeal for own dispute"
  ON public.appeals FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND dispute_id IN (SELECT id FROM public.disputes WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins see and update appeals" ON public.appeals;
CREATE POLICY "Admins see and update appeals"
  ON public.appeals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
  WITH CHECK (true);

-- dispute_actions: admin action log per dispute
CREATE TABLE IF NOT EXISTS public.dispute_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type dispute_action_type_enum NOT NULL,
  action_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_actions_dispute_id ON public.dispute_actions(dispute_id);

ALTER TABLE public.dispute_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage dispute_actions" ON public.dispute_actions;
CREATE POLICY "Admins manage dispute_actions"
  ON public.dispute_actions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users see actions for own disputes" ON public.dispute_actions;
CREATE POLICY "Users see actions for own disputes"
  ON public.dispute_actions FOR SELECT
  USING (
    dispute_id IN (SELECT id FROM public.disputes WHERE user_id = auth.uid())
  );

-- audit_logs: immutable log (no destructive deletes)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins see audit_logs" ON public.audit_logs;
CREATE POLICY "Admins see audit_logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- INSERT audit_logs: service role or backend only (no policy = deny for anon/authenticated)
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail. Insert via service role only.';

-- profiles: transparency fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'active_dispute_count') THEN
    ALTER TABLE public.profiles ADD COLUMN active_dispute_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trust_score_under_review') THEN
    ALTER TABLE public.profiles ADD COLUMN trust_score_under_review BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Trigger: updated_at on disputes
CREATE OR REPLACE FUNCTION disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_disputes_updated_at ON public.disputes;
CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION disputes_updated_at();

COMMENT ON TABLE public.disputes IS 'User-initiated disputes (employment, reference, fraud_flag, trust_score, rehire_status). One open per record.';
COMMENT ON TABLE public.dispute_evidence IS 'Evidence uploads; file_url from Supabase Storage signed URLs.';
COMMENT ON TABLE public.appeals IS 'One appeal per dispute; only when dispute resolved/rejected.';
COMMENT ON TABLE public.dispute_actions IS 'Admin action log per dispute resolution.';
COMMENT ON TABLE public.audit_logs IS 'Immutable audit; trust score, fraud flag, rehire, dispute resolution.';
