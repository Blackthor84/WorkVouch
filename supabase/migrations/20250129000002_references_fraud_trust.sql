-- ============================================================================
-- EMPLOYMENT REFERENCES, FRAUD FLAGS, TRUST SCORE FIELDS
-- References: linked to employment_matches (confirmed matches only). No circular validation.
-- ============================================================================

-- employment_references: peer references tied to confirmed employment matches
CREATE TABLE IF NOT EXISTS public.employment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_match_id UUID NOT NULL REFERENCES public.employment_matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  reliability_score NUMERIC(5,2),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  flagged BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT employment_references_no_self CHECK (reviewer_id != reviewed_user_id),
  CONSTRAINT employment_references_unique_match_reviewer UNIQUE (employment_match_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_employment_references_match ON public.employment_references(employment_match_id);
CREATE INDEX IF NOT EXISTS idx_employment_references_reviewer ON public.employment_references(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_employment_references_reviewed ON public.employment_references(reviewed_user_id);

ALTER TABLE public.employment_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view employment_references they are part of" ON public.employment_references;
CREATE POLICY "Users can view employment_references they are part of"
  ON public.employment_references FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewed_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert employment_references as reviewer" ON public.employment_references;
CREATE POLICY "Users can insert employment_references as reviewer"
  ON public.employment_references FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- fraud_flags
CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_user_id ON public.fraud_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_created_at ON public.fraud_flags(created_at DESC);

ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins and service role see fraud_flags" ON public.fraud_flags;
CREATE POLICY "Only admins and service role see fraud_flags"
  ON public.fraud_flags FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Trust scores: add columns if not present (existing table has user_id, score, job_count, reference_count, average_rating, calculated_at)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_scores' AND column_name = 'employment_verified_count') THEN
    ALTER TABLE public.trust_scores ADD COLUMN employment_verified_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_scores' AND column_name = 'average_reference_rating') THEN
    ALTER TABLE public.trust_scores ADD COLUMN average_reference_rating NUMERIC(3,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_scores' AND column_name = 'fraud_flags_count') THEN
    ALTER TABLE public.trust_scores ADD COLUMN fraud_flags_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_scores' AND column_name = 'last_updated') THEN
    ALTER TABLE public.trust_scores ADD COLUMN last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- fraud_flags: INSERT only via service role (no policy = deny for anon/authenticated)
-- No INSERT policy; API uses getSupabaseServer() to insert.

COMMENT ON TABLE public.employment_references IS 'Peer references for confirmed employment matches only. Prevents circular validation.';
COMMENT ON TABLE public.fraud_flags IS 'Fraud indicators; severity 1-5. Reduces trust score.';
