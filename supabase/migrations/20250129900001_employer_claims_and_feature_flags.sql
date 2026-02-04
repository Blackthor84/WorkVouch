-- ============================================================================
-- EMPLOYER CLAIM REQUESTS + EMPLOYER FEATURE FLAGS
-- ============================================================================

-- employer_claim_requests: user requests to claim an employer account; admin approves/rejects
CREATE TABLE IF NOT EXISTS public.employer_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_claim_requests_employer ON public.employer_claim_requests(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_claim_requests_status ON public.employer_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_employer_claim_requests_requested_by ON public.employer_claim_requests(requested_by_user_id);

ALTER TABLE public.employer_claim_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own claim requests" ON public.employer_claim_requests;
CREATE POLICY "Users see own claim requests"
  ON public.employer_claim_requests FOR SELECT
  USING (requested_by_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage claim requests" ON public.employer_claim_requests;
CREATE POLICY "Admins manage claim requests"
  ON public.employer_claim_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Insert only: authenticated users can create a claim request for an employer
DROP POLICY IF EXISTS "Authenticated can create claim request" ON public.employer_claim_requests;
CREATE POLICY "Authenticated can create claim request"
  ON public.employer_claim_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND requested_by_user_id = auth.uid());

-- Employer visibility / intelligence / marketplace feature flags
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key') THEN
    INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled, required_subscription_tier, created_at, updated_at)
    SELECT 'Employer Basic Visibility', 'employer_basic_visibility', 'Employer can see listed employees (basic visibility)', 'both', true, null, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'employer_basic_visibility');

    INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled, required_subscription_tier, created_at, updated_at)
    SELECT 'Employer Intelligence View', 'employer_intelligence_view', 'Employer can view intelligence summaries for listed employees', 'both', false, 'starter', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'employer_intelligence_view');

    INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled, required_subscription_tier, created_at, updated_at)
    SELECT 'Employer Full Intelligence', 'employer_full_intelligence', 'Employer gets full intelligence (risk, team fit) for Pro+', 'both', false, 'pro', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'employer_full_intelligence');

    INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled, required_subscription_tier, created_at, updated_at)
    SELECT 'Employer Reputation Marketplace', 'employer_reputation_marketplace', 'When enabled, /directory/employers marketplace is visible and ranked by reputation', 'ui', false, null, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'employer_reputation_marketplace');
  ELSE
    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Employer Basic Visibility', 'Employer can see listed employees (basic visibility)', true, 'both', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Employer Basic Visibility');

    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Employer Intelligence View', 'Employer can view intelligence summaries for listed employees', false, 'both', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Employer Intelligence View');

    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Employer Full Intelligence', 'Employer gets full intelligence (risk, team fit) for Pro+', false, 'both', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Employer Full Intelligence');

    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Employer Reputation Marketplace', 'When enabled, /directory/employers marketplace is visible and ranked by reputation', false, 'ui', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Employer Reputation Marketplace');
  END IF;
END $$;
