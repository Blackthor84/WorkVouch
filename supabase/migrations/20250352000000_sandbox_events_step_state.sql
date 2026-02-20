-- Step-level audit for scenario DSL: step_id, before_state, after_state (for deterministic replay and audit)
ALTER TABLE public.sandbox_events
  ADD COLUMN IF NOT EXISTS step_id TEXT,
  ADD COLUMN IF NOT EXISTS before_state JSONB,
  ADD COLUMN IF NOT EXISTS after_state JSONB;

CREATE INDEX IF NOT EXISTS idx_sandbox_events_step_id ON public.sandbox_events(step_id) WHERE step_id IS NOT NULL;

COMMENT ON COLUMN public.sandbox_events.step_id IS 'Scenario step id when event is from DSL runner.';
COMMENT ON COLUMN public.sandbox_events.before_state IS 'State before mutation (for replay/audit).';
COMMENT ON COLUMN public.sandbox_events.after_state IS 'State after mutation (for replay/audit).';
