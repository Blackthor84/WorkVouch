-- ============================================================================
-- EMPLOYMENT HISTORY & COWORKER MATCHING (Production)
-- Integrates with: profiles, employer_accounts. Uses profiles(id) for user_id.
-- ============================================================================

-- Enums for employment verification and match status
DO $$ BEGIN
  CREATE TYPE employment_verification_status AS ENUM ('pending', 'matched', 'verified', 'flagged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE employment_match_status AS ENUM ('pending', 'confirmed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- employment_records: canonical verified employment history
CREATE TABLE IF NOT EXISTS public.employment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_normalized TEXT NOT NULL,
  job_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  verification_status employment_verification_status NOT NULL DEFAULT 'pending',
  rehire_eligible BOOLEAN,
  marked_by_employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employment_records_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_employment_records_user_id ON public.employment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_employment_records_company_name ON public.employment_records(company_name);
CREATE INDEX IF NOT EXISTS idx_employment_records_company_normalized ON public.employment_records(company_normalized);
CREATE INDEX IF NOT EXISTS idx_employment_records_company_dates ON public.employment_records(company_normalized, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employment_records_verification_status ON public.employment_records(verification_status);

-- Trigger: normalize company before insert/update
CREATE OR REPLACE FUNCTION normalize_employment_company()
RETURNS TRIGGER AS $$
BEGIN
  NEW.company_normalized := LOWER(TRIM(NEW.company_name));
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_employment_company ON public.employment_records;
CREATE TRIGGER trg_normalize_employment_company
  BEFORE INSERT OR UPDATE OF company_name ON public.employment_records
  FOR EACH ROW EXECUTE FUNCTION normalize_employment_company();

-- employment_matches: coworker overlap (same company, date overlap >= 30 days)
CREATE TABLE IF NOT EXISTS public.employment_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_record_id UUID NOT NULL REFERENCES public.employment_records(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overlap_start DATE NOT NULL,
  overlap_end DATE NOT NULL,
  match_status employment_match_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employment_matches_overlap CHECK (overlap_end >= overlap_start)
);

CREATE INDEX IF NOT EXISTS idx_employment_matches_record ON public.employment_matches(employment_record_id);
CREATE INDEX IF NOT EXISTS idx_employment_matches_matched_user ON public.employment_matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_employment_matches_status ON public.employment_matches(match_status);

ALTER TABLE public.employment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_matches ENABLE ROW LEVEL SECURITY;

-- RLS: users see own employment_records; employers see via tier (enforced in API/view)
DROP POLICY IF EXISTS "Users can manage own employment_records" ON public.employment_records;
CREATE POLICY "Users can manage own employment_records"
  ON public.employment_records FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own employment_matches" ON public.employment_matches;
CREATE POLICY "Users can view own employment_matches"
  ON public.employment_matches FOR SELECT
  USING (
    employment_record_id IN (SELECT id FROM public.employment_records WHERE user_id = auth.uid())
    OR matched_user_id = auth.uid()
  );

-- Users can update match_status for matches they are part of (confirm/reject)
DROP POLICY IF EXISTS "Users can update own employment_matches" ON public.employment_matches;
CREATE POLICY "Users can update own employment_matches"
  ON public.employment_matches FOR UPDATE
  USING (
    employment_record_id IN (SELECT id FROM public.employment_records WHERE user_id = auth.uid())
    OR matched_user_id = auth.uid()
  )
  WITH CHECK (true);

-- INSERT on employment_matches: use service role in API (bypasses RLS).
COMMENT ON TABLE public.employment_records IS 'Verified employment history; company_normalized for matching.';
COMMENT ON TABLE public.employment_matches IS 'Coworker overlaps from same company and date range (>=30 days).';
