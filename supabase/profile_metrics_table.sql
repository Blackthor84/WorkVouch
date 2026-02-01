-- profile_metrics: store computed metrics for silent engines (fit score, risk, rehire, network, fraud, industry norm).
-- No UI required. Populated on profile creation, verification completion, reference submission, dispute resolution.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.profile_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stability_score NUMERIC,
  reference_score NUMERIC,
  rehire_score NUMERIC,
  dispute_score NUMERIC,
  credential_score NUMERIC,
  network_score NUMERIC,
  fraud_score NUMERIC,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_metrics_user_id ON public.profile_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_metrics_last_calculated ON public.profile_metrics(last_calculated_at);

ALTER TABLE public.profile_metrics ENABLE ROW LEVEL SECURITY;

-- Only service role and own user (via RLS) can read/write; typically engines use service role.
DROP POLICY IF EXISTS "Users can read own profile_metrics" ON public.profile_metrics;
CREATE POLICY "Users can read own profile_metrics"
  ON public.profile_metrics FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.profile_metrics IS 'Silent engine outputs: stability, reference, rehire, dispute, credential, network, fraud. No UI.';
