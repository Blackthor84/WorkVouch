-- Fuzz runs and per-step trust snapshots for Scenario Fuzzer and Trust Curve Visualizer.
-- Admin-only; simulation-safe; replayable.

CREATE TABLE IF NOT EXISTS public.sandbox_fuzz_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id TEXT NOT NULL,
  scenario_name TEXT NOT NULL,
  attack_type TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('safe', 'real')),
  sandbox_id TEXT NOT NULL,
  admin_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  step_count INT,
  result_summary JSONB,
  invariant_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_fuzz_runs_sandbox_id ON public.sandbox_fuzz_runs(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_fuzz_runs_attack_type ON public.sandbox_fuzz_runs(attack_type);
CREATE INDEX IF NOT EXISTS idx_sandbox_fuzz_runs_started_at ON public.sandbox_fuzz_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS public.sandbox_trust_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuzz_run_id UUID NOT NULL REFERENCES public.sandbox_fuzz_runs(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  step_id TEXT NOT NULL,
  actor_ref TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  profile_strength NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_trust_snapshots_fuzz_run_id ON public.sandbox_trust_snapshots(fuzz_run_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_trust_snapshots_actor ON public.sandbox_trust_snapshots(fuzz_run_id, actor_ref);

COMMENT ON TABLE public.sandbox_fuzz_runs IS 'Scenario Fuzzer runs; admin-only.';
COMMENT ON TABLE public.sandbox_trust_snapshots IS 'Per-step trust/reputation snapshots per actor for Trust Curve Visualizer.';

-- RLS: admin read only (inserts via service role from API).
ALTER TABLE public.sandbox_fuzz_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_trust_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select sandbox_fuzz_runs" ON public.sandbox_fuzz_runs;
CREATE POLICY "Admins can select sandbox_fuzz_runs"
  ON public.sandbox_fuzz_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can select sandbox_trust_snapshots" ON public.sandbox_trust_snapshots;
CREATE POLICY "Admins can select sandbox_trust_snapshots"
  ON public.sandbox_trust_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );
