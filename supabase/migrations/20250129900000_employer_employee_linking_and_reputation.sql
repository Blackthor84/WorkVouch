-- ============================================================================
-- EMPLOYER ↔ EMPLOYEE LINKING, NOTIFICATIONS, CLAIM, MATCH SCORES, REPUTATION
-- ============================================================================

-- 1) employment_records: add employer_id for auto-link to employer_accounts
ALTER TABLE public.employment_records
  ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employment_employer_id ON public.employment_records(employer_id);

COMMENT ON COLUMN public.employment_records.employer_id IS 'Linked employer account when company name matches; used for "Employees Who Listed You".';

-- 2) profiles: employee visibility to employers
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employer_visibility TEXT DEFAULT 'listed_only'
  CHECK (employer_visibility IN ('private', 'listed_only', 'verified_only', 'full'));

COMMENT ON COLUMN public.profiles.employer_visibility IS 'private=hidden, listed_only=basic listing, verified_only=if verified, full=all allowed by plan.';

-- 3) employer_accounts: claim flow
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS claim_verified BOOLEAN DEFAULT false;

-- 4) employer_notifications
CREATE TABLE IF NOT EXISTS public.employer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_record_id UUID REFERENCES public.employment_records(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_notifications_employer ON public.employer_notifications(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_notifications_created ON public.employer_notifications(employer_id, created_at DESC);

ALTER TABLE public.employer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employer can manage own notifications" ON public.employer_notifications;
CREATE POLICY "Employer can manage own notifications"
  ON public.employer_notifications FOR ALL
  USING (
    employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid())
  );

-- 5) employment_match_scores (match confidence 0-100)
CREATE TABLE IF NOT EXISTS public.employment_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_id UUID NOT NULL REFERENCES public.employment_records(id) ON DELETE CASCADE,
  confidence_score INT NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employment_id)
);

CREATE INDEX IF NOT EXISTS idx_employment_match_scores_employment ON public.employment_match_scores(employment_id);

ALTER TABLE public.employment_match_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role and employer see match scores" ON public.employment_match_scores;
CREATE POLICY "Service role and employer see match scores"
  ON public.employment_match_scores FOR SELECT
  USING (
    employment_id IN (
      SELECT er.id FROM public.employment_records er
      JOIN public.employer_accounts ea ON ea.id = er.employer_id AND ea.user_id = auth.uid()
    )
    OR employment_id IN (SELECT id FROM public.employment_records WHERE user_id = auth.uid())
  );

-- 6) employer_reputation_snapshots (one row per employer)
CREATE TABLE IF NOT EXISTS public.employer_reputation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL UNIQUE REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  reputation_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  verification_integrity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  dispute_ratio_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rehire_confirmation_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  worker_retention_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  response_time_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  workforce_risk_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  fraud_flag_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  network_trust_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  compliance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentile_rank NUMERIC(5,2),
  industry_percentile_rank NUMERIC(5,2),
  model_version TEXT,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_reputation_snapshots_employer ON public.employer_reputation_snapshots(employer_id);

ALTER TABLE public.employer_reputation_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employer select own reputation" ON public.employer_reputation_snapshots;
CREATE POLICY "Employer select own reputation"
  ON public.employer_reputation_snapshots FOR SELECT
  USING (employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin select all reputation" ON public.employer_reputation_snapshots;
CREATE POLICY "Admin select all reputation"
  ON public.employer_reputation_snapshots FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- 7) employer_reputation_history (audit / trend)
CREATE TABLE IF NOT EXISTS public.employer_reputation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  reputation_score NUMERIC(5,2) NOT NULL,
  breakdown JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_reputation_history_employer ON public.employer_reputation_history(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_reputation_history_calculated ON public.employer_reputation_history(employer_id, calculated_at DESC);

ALTER TABLE public.employer_reputation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employer select own history" ON public.employer_reputation_history;
CREATE POLICY "Employer select own history"
  ON public.employer_reputation_history FOR SELECT
  USING (employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin select all history" ON public.employer_reputation_history;
CREATE POLICY "Admin select all history"
  ON public.employer_reputation_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- 8) preview_employer_simulations (TTL 10 min)
CREATE TABLE IF NOT EXISTS public.preview_employer_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_preview_employer_simulations_expires ON public.preview_employer_simulations(expires_at);

-- 9) employment_records RLS: employer can SELECT where employer_id = own AND visibility allows
DROP POLICY IF EXISTS "Employers can view linked employment records" ON public.employment_records;
CREATE POLICY "Employers can view linked employment records"
  ON public.employment_records FOR SELECT
  USING (
    employer_id IS NOT NULL
    AND employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid())
    AND (SELECT COALESCE(employer_visibility, 'listed_only') FROM public.profiles WHERE id = employment_records.user_id LIMIT 1) <> 'private'
    AND (
      (SELECT COALESCE(employer_visibility, 'listed_only') FROM public.profiles WHERE id = employment_records.user_id LIMIT 1) <> 'verified_only'
      OR verification_status IN ('verified', 'matched')
    )
  );
