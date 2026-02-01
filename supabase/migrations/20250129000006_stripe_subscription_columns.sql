-- ============================================================================
-- Stripe subscription columns on employer_accounts
-- subscription_status, subscription_interval, lookup_quota for webhook updates
-- ============================================================================

ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_interval TEXT,
  ADD COLUMN IF NOT EXISTS lookup_quota INTEGER DEFAULT 5;

COMMENT ON COLUMN public.employer_accounts.subscription_status IS 'Stripe subscription status: active, canceled, past_due, etc.';
COMMENT ON COLUMN public.employer_accounts.subscription_interval IS 'Stripe recurring interval: month or year';
COMMENT ON COLUMN public.employer_accounts.lookup_quota IS 'Lookups per billing period; -1 = unlimited (Pro)';
