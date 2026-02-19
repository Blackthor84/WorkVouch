-- ============================================================================
-- Profiles: grace period, usage limits, seats, admin override (Stripe single source of truth)
-- Add columns not yet present; safe to run after 20250329000000.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
  ADD COLUMN IF NOT EXISTS seat_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS admin_override BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

COMMENT ON COLUMN public.profiles.grace_period_end IS 'End of 7-day grace after payment failure; access kept until then.';
COMMENT ON COLUMN public.profiles.usage_count IS 'Usage-based count; increment in app; not reset by webhook.';
COMMENT ON COLUMN public.profiles.usage_limit IS 'Max usage (pro 1000, enterprise 10000 * seats); set by webhook.';
COMMENT ON COLUMN public.profiles.seat_count IS 'Enterprise seats from Stripe subscription quantity; default 1.';
COMMENT ON COLUMN public.profiles.admin_override IS 'When true, ignore payment_failed and subscription.deleted (no auto-downgrade).';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe subscription id; unique per profile.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON public.profiles(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
