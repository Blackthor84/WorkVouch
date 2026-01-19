-- ============================================================================
-- CREATE SUBSCRIPTIONS TABLE (Simple version matching the provided code)
-- ============================================================================
-- This table is a simpler version that matches the getUserSubscription pattern
-- ============================================================================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_price_id ON public.subscriptions(price_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Function to sync from user_subscriptions to subscriptions
CREATE OR REPLACE FUNCTION sync_to_subscriptions_table()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert into subscriptions table
  INSERT INTO public.subscriptions (
    stripe_customer_id,
    stripe_subscription_id,
    price_id,
    status,
    current_period_end,
    updated_at
  )
  VALUES (
    NEW.stripe_customer_id,
    NEW.stripe_subscription_id,
    NEW.stripe_price_id,
    NEW.status,
    NEW.current_period_end,
    NOW()
  )
  ON CONFLICT (stripe_subscription_id) DO UPDATE SET
    price_id = EXCLUDED.price_id,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync
DROP TRIGGER IF EXISTS sync_subscriptions_trigger ON public.user_subscriptions;
CREATE TRIGGER sync_subscriptions_trigger
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  WHEN (NEW.stripe_customer_id IS NOT NULL AND NEW.stripe_subscription_id IS NOT NULL)
  EXECUTE FUNCTION sync_to_subscriptions_table();

-- Backfill existing subscriptions
INSERT INTO public.subscriptions (
  stripe_customer_id,
  stripe_subscription_id,
  price_id,
  status,
  current_period_end,
  created_at,
  updated_at
)
SELECT 
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status::TEXT,
  current_period_end,
  created_at,
  updated_at
FROM public.user_subscriptions
WHERE stripe_customer_id IS NOT NULL 
  AND stripe_subscription_id IS NOT NULL
  AND stripe_price_id IS NOT NULL
ON CONFLICT (stripe_subscription_id) DO NOTHING;
