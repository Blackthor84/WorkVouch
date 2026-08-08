-- Sprint 5: Persistent OAuth, snapshots, and connection health (additive only)

ALTER TABLE public.connect_connections
  ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_status TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_health_status TEXT,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_connect_connections_token_status
  ON public.connect_connections (token_status);

CREATE TABLE IF NOT EXISTS public.connect_oauth_state (
  state TEXT PRIMARY KEY,
  connection_id UUID REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  employer_account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  code_verifier_encrypted TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_oauth_state_expires
  ON public.connect_oauth_state (expires_at);

CREATE TABLE IF NOT EXISTS public.connect_event_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  sequence_number BIGINT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_count BIGINT NOT NULL DEFAULT 0,
  snapshot_type TEXT NOT NULL DEFAULT 'automatic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_event_snapshots_unique UNIQUE (aggregate_type, aggregate_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_connect_event_snapshots_aggregate
  ON public.connect_event_snapshots (aggregate_type, aggregate_id, sequence_number DESC);

ALTER TABLE public.connect_oauth_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_event_snapshots ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.connect_oauth_state IS 'Short-lived OAuth PKCE state — service role only';
COMMENT ON TABLE public.connect_event_snapshots IS 'Event store snapshots for fast projection rebuild';
