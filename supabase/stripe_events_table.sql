-- Optional: log Stripe webhook events for idempotency and debugging.
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'processed',
  error_message text NULL
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage stripe_events"
  ON public.stripe_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.stripe_events IS 'Stripe webhook event log for idempotency and audit';
