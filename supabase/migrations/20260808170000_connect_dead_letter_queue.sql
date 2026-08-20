-- Sprint 10.1: Persistent dead letter queue for WorkVouch Connect

CREATE TABLE IF NOT EXISTS public.connect_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('webhook', 'event')),
  source_id TEXT,
  connection_id UUID REFERENCES public.connect_connections(id) ON DELETE SET NULL,
  employer_account_id TEXT,
  provider TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  resolution_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (resolution_status IN ('pending', 'resolved', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_connect_dlq_status_created
  ON public.connect_dead_letter_queue (resolution_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connect_dlq_connection
  ON public.connect_dead_letter_queue (connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connect_dlq_correlation
  ON public.connect_dead_letter_queue (correlation_id);

CREATE INDEX IF NOT EXISTS idx_connect_dlq_source
  ON public.connect_dead_letter_queue (source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_connect_webhook_log_status_created
  ON public.connect_webhook_log (status, received_at DESC);

ALTER TABLE public.connect_dead_letter_queue ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.connect_dead_letter_queue IS 'Persistent DLQ — survives process restarts; supports retry/replay/search';
