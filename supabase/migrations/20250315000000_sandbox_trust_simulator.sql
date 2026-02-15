-- ============================================================================
-- SANDBOX TRUST SYSTEM SIMULATOR
-- Replay, rule versioning, synthetic population, red-team. Sandbox-only.
-- Purpose: trust laboratory, fraud stress-test, policy simulator, forensic analysis.
-- ============================================================================

-- 1. Sandbox Snapshots — state at a moment (for replay baseline). Read-only reference.
CREATE TABLE IF NOT EXISTS public.sandbox_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  name TEXT,
  snapshot_type TEXT NOT NULL DEFAULT 'full' CHECK (snapshot_type IN ('full', 'incremental')),
  state_snapshot JSONB NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_snapshots_sandbox_id ON public.sandbox_snapshots(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_snapshots_created_at ON public.sandbox_snapshots(created_at DESC);

COMMENT ON TABLE public.sandbox_snapshots IS 'Sandbox state at a moment. Replay baseline. Read-only; never mutated by replay.';

-- 2. Sandbox Replay Sessions — a replay run (read-only; does not mutate sandbox).
CREATE TABLE IF NOT EXISTS public.sandbox_replay_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES public.sandbox_snapshots(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  rule_version_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_replay_sessions_sandbox_id ON public.sandbox_replay_sessions(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_replay_sessions_status ON public.sandbox_replay_sessions(status);

COMMENT ON TABLE public.sandbox_replay_sessions IS 'Replay run. Read-only; replay does not mutate sandbox state.';

-- 3. Sandbox Replay Events — ordered events to replay (employment, overlap, review, trust update, penalty, admin, incident).
CREATE TABLE IF NOT EXISTS public.sandbox_replay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_session_id UUID NOT NULL REFERENCES public.sandbox_replay_sessions(id) ON DELETE CASCADE,
  event_order INT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  before_state JSONB,
  after_state JSONB,
  trust_score_before NUMERIC,
  trust_score_after NUMERIC,
  rule_version_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_replay_events_replay_session ON public.sandbox_replay_events(replay_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sandbox_replay_events_order ON public.sandbox_replay_events(replay_session_id, event_order);

COMMENT ON TABLE public.sandbox_replay_events IS 'Ordered replayable events. Before/after and rule version for explainability.';

-- 4. Rule Versions — immutable trust-critical rule sets (formula, overlap, penalties, fraud thresholds).
CREATE TABLE IF NOT EXISTS public.sandbox_rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_name TEXT NOT NULL,
  version_tag TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active_sandbox BOOLEAN NOT NULL DEFAULT false,
  is_active_production BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_rule_versions_rule_set ON public.sandbox_rule_versions(rule_set_name);
CREATE INDEX IF NOT EXISTS idx_sandbox_rule_versions_active ON public.sandbox_rule_versions(is_active_sandbox, is_active_production);

COMMENT ON TABLE public.sandbox_rule_versions IS 'Immutable rule versions. One active per environment. Sandbox can run multiple in parallel.';

-- 5. Synthetic Populations — generated workforce for stress-testing.
CREATE TABLE IF NOT EXISTS public.sandbox_synthetic_populations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  name TEXT,
  params JSONB NOT NULL DEFAULT '{}',
  user_count INT NOT NULL DEFAULT 0,
  employer_count INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_synthetic_populations_sandbox_id ON public.sandbox_synthetic_populations(sandbox_id);

COMMENT ON TABLE public.sandbox_synthetic_populations IS 'Synthetic workforce generator runs. Params: user_count, employer_count, overlap_density, pct_malicious, etc.';

-- 6. Red-Team Runs — adversarial simulation outcomes.
CREATE TABLE IF NOT EXISTS public.sandbox_redteam_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_id UUID NOT NULL REFERENCES public.sandbox_sessions(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  outcome JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_redteam_runs_sandbox_id ON public.sandbox_redteam_runs(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_redteam_runs_scenario ON public.sandbox_redteam_runs(scenario);

COMMENT ON TABLE public.sandbox_redteam_runs IS 'Red-team simulation runs. Tracks detection success, latency, trust damage.';

-- Optional FKs for rule_version_id (allow null; set when replay uses a specific version)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sandbox_replay_sessions_rule_version_fkey') THEN
    ALTER TABLE public.sandbox_replay_sessions ADD CONSTRAINT sandbox_replay_sessions_rule_version_fkey
      FOREIGN KEY (rule_version_id) REFERENCES public.sandbox_rule_versions(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sandbox_replay_events_rule_version_fkey') THEN
    ALTER TABLE public.sandbox_replay_events ADD CONSTRAINT sandbox_replay_events_rule_version_fkey
      FOREIGN KEY (rule_version_id) REFERENCES public.sandbox_rule_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS: service role only (admin APIs use service role with admin check). Sandbox data never exposed to anon.
ALTER TABLE public.sandbox_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_replay_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_replay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_synthetic_populations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_redteam_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only sandbox_snapshots" ON public.sandbox_snapshots;
CREATE POLICY "Service role only sandbox_snapshots" ON public.sandbox_snapshots FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only sandbox_replay_sessions" ON public.sandbox_replay_sessions;
CREATE POLICY "Service role only sandbox_replay_sessions" ON public.sandbox_replay_sessions FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only sandbox_replay_events" ON public.sandbox_replay_events;
CREATE POLICY "Service role only sandbox_replay_events" ON public.sandbox_replay_events FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only sandbox_rule_versions" ON public.sandbox_rule_versions;
CREATE POLICY "Service role only sandbox_rule_versions" ON public.sandbox_rule_versions FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only sandbox_synthetic_populations" ON public.sandbox_synthetic_populations;
CREATE POLICY "Service role only sandbox_synthetic_populations" ON public.sandbox_synthetic_populations FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only sandbox_redteam_runs" ON public.sandbox_redteam_runs;
CREATE POLICY "Service role only sandbox_redteam_runs" ON public.sandbox_redteam_runs FOR ALL USING (false);
