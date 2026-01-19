-- ============================================================================
-- SAFE MIGRATION SCRIPT
-- ============================================================================
-- This script safely adds new columns and tables without errors if they exist
-- Run this after your base schema is already set up
-- ============================================================================

-- Add stripe_customer_id to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN stripe_customer_id TEXT;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
    ON public.profiles(stripe_customer_id);
  END IF;
END $$;

-- Create subscription-related types if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM (
      'active',
      'canceled',
      'past_due',
      'unpaid',
      'trialing'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM (
      'starter',
      'pro',
      'elite',
      'emp_lite',
      'emp_pro',
      'emp_enterprise'
    );
  END IF;
END $$;

-- Create user_subscriptions table if it doesn't exist (detailed version)
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

-- Create subscriptions table if it doesn't exist (simple version matching your code)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  price_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create employer_lookups table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.employer_lookups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lookup_type TEXT NOT NULL DEFAULT 'profile',
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions(tier);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_price_id ON public.subscriptions(price_id);

CREATE INDEX IF NOT EXISTS idx_employer_lookups_employer ON public.employer_lookups(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_lookups_candidate ON public.employer_lookups(candidate_id);
CREATE INDEX IF NOT EXISTS idx_employer_lookups_used_at ON public.employer_lookups(used_at);
CREATE INDEX IF NOT EXISTS idx_employer_lookups_subscription ON public.employer_lookups(subscription_id);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  related_connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  related_reference_id UUID REFERENCES public.references(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Create employer_purchases table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.employer_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_employer_purchases_employer ON public.employer_purchases(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_purchases_candidate ON public.employer_purchases(candidate_id);
CREATE INDEX IF NOT EXISTS idx_employer_purchases_status ON public.employer_purchases(status);
CREATE INDEX IF NOT EXISTS idx_employer_purchases_stripe_session ON public.employer_purchases(stripe_checkout_session_id);

-- Create coworker_matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coworker_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job1_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job2_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  match_confidence DECIMAL(3,2) DEFAULT 1.0,
  notified_user1 BOOLEAN NOT NULL DEFAULT false,
  notified_user2 BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user1_id, user2_id, job1_id, job2_id),
  CONSTRAINT valid_user_order CHECK (user1_id < user2_id)
);

CREATE INDEX IF NOT EXISTS idx_coworker_matches_user1 ON public.coworker_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_coworker_matches_user2 ON public.coworker_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_coworker_matches_notified ON public.coworker_matches(notified_user1, notified_user2);

-- Enable RLS on new tables (safe - won't error if already enabled)
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coworker_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Employers can view own lookups" ON public.employer_lookups;
CREATE POLICY "Employers can view own lookups"
  ON public.employer_lookups FOR SELECT
  USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Admins can view all lookups" ON public.employer_lookups;
CREATE POLICY "Admins can view all lookups"
  ON public.employer_lookups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Employers can view own purchases" ON public.employer_purchases;
CREATE POLICY "Employers can view own purchases"
  ON public.employer_purchases FOR SELECT
  USING (
    auth.uid() = employer_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view own matches" ON public.coworker_matches;
CREATE POLICY "Users can view own matches"
  ON public.coworker_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for subscriptions table
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.stripe_customer_id = subscriptions.stripe_customer_id
      AND profiles.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
