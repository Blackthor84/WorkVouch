-- Sprint 4: WorkVouch Connect Event Store (additive only)
-- Event Sourcing Lite — immutable append-only event history

CREATE TABLE IF NOT EXISTS public.connect_event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_version TEXT NOT NULL DEFAULT '1.0.0',
  connect_version TEXT NOT NULL DEFAULT '1.0.0',
  company_id TEXT NOT NULL,
  connection_id UUID,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  sequence_number BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  provider_event_type TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_event_store_aggregate_sequence_unique
    UNIQUE (aggregate_type, aggregate_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_connect_event_store_correlation
  ON public.connect_event_store (correlation_id);
CREATE INDEX IF NOT EXISTS idx_connect_event_store_company
  ON public.connect_event_store (company_id);
CREATE INDEX IF NOT EXISTS idx_connect_event_store_aggregate
  ON public.connect_event_store (aggregate_type, aggregate_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_connect_event_store_event_type
  ON public.connect_event_store (event_type);
CREATE INDEX IF NOT EXISTS idx_connect_event_store_occurred_at
  ON public.connect_event_store (occurred_at DESC);

COMMENT ON TABLE public.connect_event_store IS 'Immutable WorkVouch Connect event store — append only';

CREATE TABLE IF NOT EXISTS public.connect_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT,
  provider_account_name TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  oauth_scopes TEXT[] DEFAULT '{}',
  webhook_secret_hint TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_connections_employer_provider_unique UNIQUE (employer_account_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_connect_connections_employer
  ON public.connect_connections (employer_account_id);
CREATE INDEX IF NOT EXISTS idx_connect_connections_provider
  ON public.connect_connections (provider);

CREATE TABLE IF NOT EXISTS public.connect_provider_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_account_id TEXT NOT NULL,
  account_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_provider_accounts_unique UNIQUE (connection_id, external_account_id)
);

CREATE TABLE IF NOT EXISTS public.connect_candidate_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  external_candidate_id TEXT NOT NULL,
  workvouch_profile_id UUID,
  candidate_email TEXT,
  candidate_name TEXT,
  application_status TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_candidate_map_unique UNIQUE (connection_id, external_candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_candidate_map_email
  ON public.connect_candidate_map (candidate_email);

CREATE TABLE IF NOT EXISTS public.connect_job_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  external_job_id TEXT NOT NULL,
  job_title TEXT,
  status TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_job_map_unique UNIQUE (connection_id, external_job_id)
);

CREATE TABLE IF NOT EXISTS public.connect_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.connect_connections(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL,
  duration_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_sync_log_connection
  ON public.connect_sync_log (connection_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.connect_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.connect_connections(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  provider_event_type TEXT NOT NULL,
  normalized_event_type TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  payload_hash TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT connect_webhook_log_dedup UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_webhook_log_connection
  ON public.connect_webhook_log (connection_id, received_at DESC);

CREATE TABLE IF NOT EXISTS public.connect_projection_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  projection_name TEXT NOT NULL,
  sequence_number BIGINT NOT NULL DEFAULT 0,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_projection_state_unique UNIQUE (aggregate_type, aggregate_id, projection_name)
);

CREATE INDEX IF NOT EXISTS idx_connect_projection_state_aggregate
  ON public.connect_projection_state (aggregate_type, aggregate_id);

-- Service role only — no RLS policies for employer access in Sprint 4
ALTER TABLE public.connect_event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_provider_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_candidate_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_job_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_webhook_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_projection_state ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.connect_projection_state IS 'Derived read models — rebuilt from connect_event_store';
