-- Sprint 8A: Hiring intelligence metrics snapshots (additive only)

CREATE TABLE IF NOT EXISTS public.connect_hiring_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_account_id TEXT NOT NULL,
  connection_id UUID REFERENCES public.connect_connections(id) ON DELETE SET NULL,
  provider TEXT,
  aggregation_level TEXT NOT NULL DEFAULT 'employer',
  aggregation_key TEXT NOT NULL,
  period TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_hiring_metrics_employer
  ON public.connect_hiring_metrics_snapshots (employer_account_id, period, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connect_hiring_metrics_connection
  ON public.connect_hiring_metrics_snapshots (connection_id);

COMMENT ON TABLE public.connect_hiring_metrics_snapshots IS 'Periodic hiring intelligence snapshots for trend analysis and ROI reporting';
