-- Intelligence columns on profiles (risk snapshot, network metrics).
-- Run in Supabase SQL Editor. Do not enable any feature globally.

-- Risk snapshot (JSONB) – output of calculateRiskSnapshot()
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_snapshot JSONB NULL;

COMMENT ON COLUMN public.profiles.risk_snapshot IS 'Computed risk snapshot (tenure, reference rate, rehire index, gaps, dispute risk, overall). Hidden behind risk_snapshot feature flag.';

-- Network / fraud metrics (NUMERIC) – from networkMetrics
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS network_density NUMERIC NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reference_velocity NUMERIC NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fraud_signal_score NUMERIC NULL;

COMMENT ON COLUMN public.profiles.network_density IS 'Network density 0–1. Silent; not rendered.';
COMMENT ON COLUMN public.profiles.reference_velocity IS 'Reference velocity (responses per month). Silent; not rendered.';
COMMENT ON COLUMN public.profiles.fraud_signal_score IS 'Fraud signal 0–1 from cluster detection. Silent; not rendered.';
