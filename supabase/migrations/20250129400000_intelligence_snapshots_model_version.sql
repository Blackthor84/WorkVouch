-- Add model_version to intelligence_snapshots for versioned enterprise model
ALTER TABLE public.intelligence_snapshots
  ADD COLUMN IF NOT EXISTS model_version TEXT NOT NULL DEFAULT 'v1.0-enterprise';

COMMENT ON COLUMN public.intelligence_snapshots.model_version IS 'Model version for enterprise intelligence (e.g. v1.0-enterprise).';
