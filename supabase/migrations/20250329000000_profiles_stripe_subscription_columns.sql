-- ============================================================================
-- Profiles: Stripe subscription state (single source of truth from webhooks)
-- subscription_tier (free | pro), subscription_status, stripe_customer_id,
-- subscription_period_end, plan_interval, last_stripe_event_id for idempotency.
-- ============================================================================

-- Subscription tier: free (default) or pro. Webhook sets pro on checkout.session.completed.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_interval TEXT,
  ADD COLUMN IF NOT EXISTS last_stripe_event_id TEXT;

COMMENT ON COLUMN public.profiles.subscription_tier IS 'free | pro; set by Stripe webhook.';
COMMENT ON COLUMN public.profiles.subscription_status IS 'active | past_due | canceled | grace; set by webhook.';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer id; unique per profile.';
COMMENT ON COLUMN public.profiles.subscription_period_end IS 'Current period end from Stripe subscription.';
COMMENT ON COLUMN public.profiles.subscription_expires_at IS 'Synced from subscription_period_end for backward compatibility (e.g. resume view).';
COMMENT ON COLUMN public.profiles.plan_interval IS 'month | year from Stripe price.recurring.interval.';
COMMENT ON COLUMN public.profiles.last_stripe_event_id IS 'Last Stripe event id applied to this profile; idempotency.';

-- Unique constraint so one Stripe customer maps to one profile (optional but recommended)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
  ON public.profiles(subscription_status) WHERE subscription_status IS NOT NULL;
