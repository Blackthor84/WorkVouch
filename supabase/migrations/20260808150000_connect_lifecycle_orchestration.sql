-- Sprint 7: Candidate lifecycle orchestration (additive only)

CREATE TABLE IF NOT EXISTS public.connect_lifecycle_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  employer_account_id TEXT NOT NULL,
  external_candidate_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'imported',
  previous_state TEXT,
  last_event_type TEXT,
  last_decision TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connect_lifecycle_state_unique UNIQUE (connection_id, external_candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_connect_lifecycle_state_connection
  ON public.connect_lifecycle_state (connection_id);
CREATE INDEX IF NOT EXISTS idx_connect_lifecycle_state_state
  ON public.connect_lifecycle_state (state);

CREATE TABLE IF NOT EXISTS public.connect_invitation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  employer_account_id TEXT NOT NULL,
  external_candidate_id TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_name TEXT,
  job_external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  correlation_id TEXT NOT NULL,
  rule_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_invitation_queue_connection
  ON public.connect_invitation_queue (connection_id);
CREATE INDEX IF NOT EXISTS idx_connect_invitation_queue_status
  ON public.connect_invitation_queue (status);
CREATE INDEX IF NOT EXISTS idx_connect_invitation_queue_scheduled
  ON public.connect_invitation_queue (scheduled_at);

CREATE TABLE IF NOT EXISTS public.connect_workflow_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id TEXT NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.connect_connections(id) ON DELETE CASCADE,
  employer_account_id TEXT NOT NULL,
  universal_event TEXT NOT NULL,
  rule_matched TEXT,
  decision TEXT NOT NULL,
  action TEXT NOT NULL,
  workflow_result TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connect_workflow_log_connection
  ON public.connect_workflow_log (connection_id);
CREATE INDEX IF NOT EXISTS idx_connect_workflow_log_correlation
  ON public.connect_workflow_log (correlation_id);

COMMENT ON TABLE public.connect_lifecycle_state IS 'Candidate lifecycle state machine positions';
COMMENT ON TABLE public.connect_invitation_queue IS 'Internal invitation queue for automation workflows';
COMMENT ON TABLE public.connect_workflow_log IS 'Orchestration observability audit trail';
