-- ============================================================================
-- PEER-FIRST CONFIRMATION + ENTERPRISE INTELLIGENCE INFRASTRUCTURE
-- ============================================================================
-- PART 2: confirmation_level on employment_records
-- PART 3: employer_roster_upload
-- PART 4: enterprise_intelligence_hidden feature flag
-- STEP 1: workforce_metrics, reputation_marketplace_listings
-- ============================================================================

-- employment_records: add confirmation columns (TEXT + CHECK for portability)
ALTER TABLE public.employment_records
  ADD COLUMN IF NOT EXISTS confirmation_level TEXT NOT NULL DEFAULT 'self_reported' CHECK (confirmation_level IN ('self_reported', 'peer_confirmed', 'employer_confirmed', 'multi_confirmed')),
  ADD COLUMN IF NOT EXISTS peer_confirmation_count INT NOT NULL DEFAULT 0 CHECK (peer_confirmation_count >= 0),
  ADD COLUMN IF NOT EXISTS employer_confirmation_status TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_weight_score NUMERIC(5,2) CHECK (confirmation_weight_score IS NULL OR (confirmation_weight_score >= 0 AND confirmation_weight_score <= 100));

CREATE INDEX IF NOT EXISTS idx_employment_records_confirmation_level ON public.employment_records(confirmation_level);
COMMENT ON COLUMN public.employment_records.confirmation_level IS 'Derived: peer_confirmation_count>=2→peer_confirmed; employer_confirmation_status=approved→employer_confirmed; both→multi_confirmed.';
COMMENT ON COLUMN public.employment_records.peer_confirmation_count IS 'Number of peer confirmations (e.g. employment_matches confirmed).';
COMMENT ON COLUMN public.employment_records.employer_confirmation_status IS 'approved | pending | rejected | null.';
COMMENT ON COLUMN public.employment_records.confirmation_weight_score IS '0-100 composite weight from peer + employer confirmation.';

-- employer_roster_upload (Pro/Custom bulk upload)
CREATE TABLE IF NOT EXISTS public.employer_roster_upload (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upload_batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  employee_name TEXT,
  employee_email TEXT,
  role TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_roster_upload_employer ON public.employer_roster_upload(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_roster_upload_batch ON public.employer_roster_upload(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_employer_roster_upload_status ON public.employer_roster_upload(status);

ALTER TABLE public.employer_roster_upload ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employer can manage own roster uploads" ON public.employer_roster_upload;
CREATE POLICY "Employer can manage own roster uploads"
  ON public.employer_roster_upload FOR ALL
  USING (employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid()))
  WITH CHECK (employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin can view roster uploads" ON public.employer_roster_upload;
CREATE POLICY "Admin can view roster uploads"
  ON public.employer_roster_upload FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

-- workforce_metrics (employer-level; hidden enterprise)
CREATE TABLE IF NOT EXISTS public.workforce_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL UNIQUE REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  avg_profile_score NUMERIC(5,2),
  multi_confirmed_percentage NUMERIC(5,2),
  rehire_probability_average NUMERIC(5,2),
  workforce_stability_index NUMERIC(5,2),
  risk_index NUMERIC(5,2),
  fraud_exposure_score NUMERIC(5,2),
  calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workforce_metrics_employer ON public.workforce_metrics(employer_id);
ALTER TABLE public.workforce_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin select workforce_metrics" ON public.workforce_metrics;
CREATE POLICY "Admin select workforce_metrics"
  ON public.workforce_metrics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

DROP POLICY IF EXISTS "Employer select own workforce_metrics" ON public.workforce_metrics;
CREATE POLICY "Employer select own workforce_metrics"
  ON public.workforce_metrics FOR SELECT
  USING (employer_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid()));

-- reputation_marketplace_listings (visibility tier / boost)
CREATE TABLE IF NOT EXISTS public.reputation_marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('spotlight', 'verified_badge', 'featured_industry')),
  score_boost NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (score_boost >= 0 AND score_boost <= 100),
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_marketplace_listings_employer ON public.reputation_marketplace_listings(employer_id);
CREATE INDEX IF NOT EXISTS idx_reputation_marketplace_listings_active ON public.reputation_marketplace_listings(active, expires_at);

ALTER TABLE public.reputation_marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role and admin manage marketplace listings" ON public.reputation_marketplace_listings;
CREATE POLICY "Service role and admin manage marketplace listings"
  ON public.reputation_marketplace_listings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));

-- Feature flag: enterprise_intelligence_hidden (workforce dashboard only for admin/superadmin or when enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key') THEN
    INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled, required_subscription_tier, created_at, updated_at)
    SELECT 'Enterprise Intelligence Hidden', 'enterprise_intelligence_hidden', 'When enabled, employer can see hidden workforce/intelligence dashboard. Otherwise admin/superadmin only.', 'ui', false, null, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'enterprise_intelligence_hidden');
  ELSE
    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Enterprise Intelligence Hidden', 'When enabled, employer can see hidden workforce/intelligence dashboard.', false, 'ui', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Enterprise Intelligence Hidden');
  END IF;
END $$;

-- reputation_marketplace_hidden (marketplace purchase flow)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key') THEN
    INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled, required_subscription_tier, created_at, updated_at)
    SELECT 'Reputation Marketplace Hidden', 'reputation_marketplace_hidden', 'When enabled, employers can purchase visibility tier (spotlight, verified_badge, featured_industry).', 'ui', false, null, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'reputation_marketplace_hidden');
  ELSE
    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Reputation Marketplace Hidden', 'Employers can purchase visibility tier.', false, 'ui', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Reputation Marketplace Hidden');
  END IF;
END $$;
