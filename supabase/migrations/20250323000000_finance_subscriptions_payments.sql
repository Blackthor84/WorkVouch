-- ============================================================================
-- Finance: subscriptions + payments for revenue truth (Stripe-backed).
-- Never store card data or billing address. Audit-safe; aggregated only in APIs.
-- ============================================================================

-- Subscriptions: mirror of active Stripe subscriptions for MRR/ARR.
CREATE TABLE IF NOT EXISTS public.finance_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_sub_id text NOT NULL UNIQUE,
  plan text NOT NULL,
  status text NOT NULL,
  monthly_amount_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_subscriptions_employer ON public.finance_subscriptions(employer_id);
CREATE INDEX IF NOT EXISTS idx_finance_subscriptions_stripe_customer ON public.finance_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_finance_subscriptions_status ON public.finance_subscriptions(status);

COMMENT ON TABLE public.finance_subscriptions IS 'Stripe subscription mirror for MRR/ARR; no card data.';

-- Payments: paid invoices (revenue truth). subscription_id = Stripe subscription id.
CREATE TABLE IF NOT EXISTS public.finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id text NOT NULL,
  stripe_invoice_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_payments_paid_at ON public.finance_payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_finance_payments_stripe_sub ON public.finance_payments(stripe_subscription_id);

COMMENT ON TABLE public.finance_payments IS 'Paid Stripe invoices; revenue aggregation only. No PII.';

-- RLS: service role only (no direct client access); APIs use service role.
ALTER TABLE public.finance_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only subscriptions" ON public.finance_subscriptions
  FOR ALL USING (false);

CREATE POLICY "Service role only payments" ON public.finance_payments
  FOR ALL USING (false);
