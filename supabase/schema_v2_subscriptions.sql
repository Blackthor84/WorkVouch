-- ============================================================================
-- PEERCV VERSION 2 - SUBSCRIPTION MANAGEMENT
-- ============================================================================
-- This file adds subscription tracking for user and employer tiers
-- ============================================================================

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'canceled',
  'past_due',
  'unpaid',
  'trialing'
);

-- Subscription tier enum
CREATE TYPE subscription_tier AS ENUM (
  'starter',      -- Free tier
  'pro',          -- User Pro
  'elite',        -- User Elite
  'emp_lite',     -- Employer Lite
  'emp_pro',      -- Employer Pro
  'emp_enterprise' -- Employer Enterprise
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'starter',
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tier)
);

-- Employer lookup usage tracking
CREATE TABLE IF NOT EXISTS public.employer_lookups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lookup_type TEXT NOT NULL DEFAULT 'profile', -- 'profile' or 'report'
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Track which subscription period this was used in
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions(tier);

CREATE INDEX IF NOT EXISTS idx_employer_lookups_employer ON public.employer_lookups(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_lookups_candidate ON public.employer_lookups(candidate_id);
CREATE INDEX IF NOT EXISTS idx_employer_lookups_used_at ON public.employer_lookups(used_at);
CREATE INDEX IF NOT EXISTS idx_employer_lookups_subscription ON public.employer_lookups(subscription_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get user's active subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS subscription_tier AS $$
DECLARE
  v_tier subscription_tier;
BEGIN
  SELECT tier INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > NOW())
  ORDER BY 
    CASE tier
      WHEN 'elite' THEN 1
      WHEN 'pro' THEN 2
      WHEN 'emp_enterprise' THEN 3
      WHEN 'emp_pro' THEN 4
      WHEN 'emp_lite' THEN 5
      WHEN 'starter' THEN 6
    END
  LIMIT 1;
  
  RETURN COALESCE(v_tier, 'starter');
END;
$$ LANGUAGE plpgsql;

-- Function to check if employer has lookup quota available
CREATE OR REPLACE FUNCTION check_employer_lookup_quota(p_employer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier subscription_tier;
  v_lookup_count INTEGER;
  v_quota INTEGER;
BEGIN
  -- Get employer's subscription tier
  v_tier := get_user_subscription_tier(p_employer_id);
  
  -- Determine quota based on tier
  CASE v_tier
    WHEN 'emp_enterprise' THEN
      v_quota := 999999; -- Unlimited
    WHEN 'emp_pro' THEN
      v_quota := 100;
    WHEN 'emp_lite' THEN
      v_quota := 20;
    ELSE
      v_quota := 0; -- No subscription, must pay per lookup
  END CASE;
  
  -- If unlimited, return true
  IF v_quota >= 999999 THEN
    RETURN true;
  END IF;
  
  -- Count lookups in current billing period
  SELECT COUNT(*) INTO v_lookup_count
  FROM public.employer_lookups el
  JOIN public.user_subscriptions us ON el.subscription_id = us.id
  WHERE el.employer_id = p_employer_id
    AND us.status IN ('active', 'trialing')
    AND us.current_period_start <= el.used_at
    AND (us.current_period_end IS NULL OR us.current_period_end >= el.used_at);
  
  -- If no subscription, check all-time lookups (for pay-per-lookup)
  IF v_lookup_count = 0 THEN
    SELECT COUNT(*) INTO v_lookup_count
    FROM public.employer_lookups
    WHERE employer_id = p_employer_id
      AND used_at >= DATE_TRUNC('month', NOW());
  END IF;
  
  RETURN v_lookup_count < v_quota;
END;
$$ LANGUAGE plpgsql;

-- Function to record a lookup
CREATE OR REPLACE FUNCTION record_employer_lookup(
  p_employer_id UUID,
  p_candidate_id UUID,
  p_lookup_type TEXT DEFAULT 'profile'
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_lookup_id UUID;
BEGIN
  -- Get active subscription for this employer
  SELECT id INTO v_subscription_id
  FROM public.user_subscriptions
  WHERE user_id = p_employer_id
    AND status IN ('active', 'trialing')
    AND tier IN ('emp_lite', 'emp_pro', 'emp_enterprise')
    AND (current_period_end IS NULL OR current_period_end > NOW())
  ORDER BY current_period_end DESC NULLS LAST
  LIMIT 1;
  
  -- Record the lookup
  INSERT INTO public.employer_lookups (
    employer_id, candidate_id, lookup_type, subscription_id
  )
  VALUES (p_employer_id, p_candidate_id, p_lookup_type, v_subscription_id)
  RETURNING id INTO v_lookup_id;
  
  RETURN v_lookup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_lookups ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Employers can view their own lookups
CREATE POLICY "Employers can view own lookups"
  ON public.employer_lookups FOR SELECT
  USING (auth.uid() = employer_id);

-- Admins can view all lookups
CREATE POLICY "Admins can view all lookups"
  ON public.employer_lookups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
