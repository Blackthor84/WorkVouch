-- ============================================================================
-- SaaS scaling: employer_accounts extend + usage_logs + stripe_usage_events
-- Run in Supabase SQL editor. Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================================

-- A) Extend employer_accounts
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS seats_allowed INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS seats_used INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reports_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS searches_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_report_overage_item_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_search_overage_item_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_seat_overage_item_id TEXT;

CREATE INDEX IF NOT EXISTS idx_employer_accounts_stripe_subscription_id
  ON public.employer_accounts(stripe_subscription_id);

-- B) usage_logs - every billable action
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('report', 'search', 'seat_add', 'seat_remove')),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_employer_id ON public.usage_logs(employer_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_employer_created ON public.usage_logs(employer_id, created_at);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view own usage_logs" ON public.usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employer_accounts
      WHERE id = employer_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all usage_logs" ON public.usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Service/API inserts (use service role in app)
CREATE POLICY "Service can insert usage_logs" ON public.usage_logs
  FOR INSERT WITH CHECK (true);

-- C) stripe_usage_events - prevent duplicate Stripe usage reporting
CREATE TABLE IF NOT EXISTS public.stripe_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_item_id TEXT NOT NULL,
  usage_quantity INTEGER NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_usage_events_idempotent
  ON public.stripe_usage_events(stripe_subscription_item_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_stripe_usage_events_processed ON public.stripe_usage_events(processed_at);

ALTER TABLE public.stripe_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage stripe_usage_events" ON public.stripe_usage_events
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.usage_logs IS 'Billable actions for SaaS limits and overage billing';
COMMENT ON TABLE public.stripe_usage_events IS 'Idempotency for Stripe metered usage records';
