-- Sprint 6A: Incremental Sync Cursor Engine (additive only)

CREATE TABLE IF NOT EXISTS public.connect_sync_cursor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_version TEXT NOT NULL DEFAULT '1.0.0',
  connect_version TEXT NOT NULL DEFAULT '1.0.0',
  last_successful_sync TIMESTAMPTZ,
  last_candidate_imported TIMESTAMPTZ,
  last_job_imported TIMESTAMPTZ,
  last_application_imported TIMESTAMPTZ,
  last_event_received TIMESTAMPTZ,
  last_webhook_processed TIMESTAMPTZ,
  last_projection_completed TIMESTAMPTZ,
  next_scheduled_sync TIMESTAMPTZ,
  sync_cursor JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_cursor JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sequence_number BIGINT DEFAULT 0,
  last_snapshot_id UUID,
  last_snapshot_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'idle',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_sync_cursor_connection_unique UNIQUE (connection_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_sync_cursor_connection
  ON public.connect_sync_cursor (connection_id);
CREATE INDEX IF NOT EXISTS idx_connect_sync_cursor_provider
  ON public.connect_sync_cursor (provider);
CREATE INDEX IF NOT EXISTS idx_connect_sync_cursor_status
  ON public.connect_sync_cursor (status);
CREATE INDEX IF NOT EXISTS idx_connect_sync_cursor_next_scheduled
  ON public.connect_sync_cursor (next_scheduled_sync);

CREATE TABLE IF NOT EXISTS public.connect_sync_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cursor_id UUID NOT NULL REFERENCES public.connect_sync_cursor(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  checkpoint_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sequence_number BIGINT,
  event_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  imported_candidates INTEGER NOT NULL DEFAULT 0,
  imported_jobs INTEGER NOT NULL DEFAULT 0,
  imported_applications INTEGER NOT NULL DEFAULT 0,
  snapshot_id UUID,
  replay_reference TEXT,
  sync_type TEXT NOT NULL DEFAULT 'incremental',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_sync_checkpoints_cursor
  ON public.connect_sync_checkpoints (cursor_id, checkpoint_at DESC);
CREATE INDEX IF NOT EXISTS idx_connect_sync_checkpoints_connection
  ON public.connect_sync_checkpoints (connection_id, checkpoint_at DESC);

ALTER TABLE public.connect_sync_cursor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_sync_checkpoints ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.connect_sync_cursor IS 'Provider-agnostic sync cursor — memory of last successful sync position';
COMMENT ON TABLE public.connect_sync_checkpoints IS 'Immutable sync checkpoints for resume and recovery';
