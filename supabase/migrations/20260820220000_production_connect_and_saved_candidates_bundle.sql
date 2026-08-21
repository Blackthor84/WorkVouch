-- Production bundle: WorkVouch Connect + saved_candidates
-- Combines canonical migrations (no schema invention). Apply in one transaction on production.
--
-- Sources (dependency order):
--   1. 20260808120000_connect_event_store.sql
--   2. 20260808130000_connect_oauth_snapshots.sql
--   3. 20260808140000_connect_sync_cursor.sql
--   4. 20260808150000_connect_lifecycle_orchestration.sql
--   5. 20260808160000_connect_hiring_intelligence.sql
--   6. 20260808170000_connect_dead_letter_queue.sql
--   7. 20250616000000_saved_candidates.sql
--
-- Does NOT create organizations, tenant_memberships, employer_users, or profiles changes.

BEGIN;

-- =============================================================================
-- 1/7 — 20260808120000_connect_event_store.sql
-- =============================================================================

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

-- =============================================================================
-- 2/7 — 20260808130000_connect_oauth_snapshots.sql
-- =============================================================================

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

-- =============================================================================
-- 3/7 — 20260808140000_connect_sync_cursor.sql
-- =============================================================================

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

-- =============================================================================
-- 4/7 — 20260808150000_connect_lifecycle_orchestration.sql
-- =============================================================================

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

-- =============================================================================
-- 5/7 — 20260808160000_connect_hiring_intelligence.sql
-- =============================================================================

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

-- =============================================================================
-- 6/7 — 20260808170000_connect_dead_letter_queue.sql
-- =============================================================================

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

-- =============================================================================
-- 7/7 — 20250616000000_saved_candidates.sql
-- =============================================================================

-- Saved candidates (employer user id = profiles.id)
CREATE TABLE IF NOT EXISTS public.saved_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_candidates_employer ON public.saved_candidates(employer_id);
CREATE INDEX IF NOT EXISTS idx_saved_candidates_candidate ON public.saved_candidates(candidate_id);

ALTER TABLE public.saved_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can manage own saved candidates" ON public.saved_candidates;
CREATE POLICY "Employers can manage own saved candidates"
  ON public.saved_candidates FOR ALL
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

COMMENT ON TABLE public.saved_candidates IS 'Employer-saved candidates for hiring workflow.';

COMMIT;
