-- Sandbox logging: activity_log and sandbox_events get sandbox_id, scenario_id (and entity_type for system activity).
-- Every sandbox mutation must log to both with these fields.

-- activity_log: optional sandbox context for user activity
ALTER TABLE public.activity_log
  ADD COLUMN IF NOT EXISTS sandbox_id UUID,
  ADD COLUMN IF NOT EXISTS scenario_id UUID;

CREATE INDEX IF NOT EXISTS idx_activity_log_sandbox_id ON public.activity_log(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_log_scenario_id ON public.activity_log(scenario_id) WHERE scenario_id IS NOT NULL;

COMMENT ON COLUMN public.activity_log.sandbox_id IS 'Set when action is performed in sandbox Playground.';
COMMENT ON COLUMN public.activity_log.scenario_id IS 'Set when action is part of a scenario run.';

-- sandbox_events: event_type (keep type), entity_type, sandbox_id, scenario_id
ALTER TABLE public.sandbox_events
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS sandbox_id UUID,
  ADD COLUMN IF NOT EXISTS scenario_id UUID;

CREATE INDEX IF NOT EXISTS idx_sandbox_events_sandbox_id ON public.sandbox_events(sandbox_id) WHERE sandbox_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sandbox_events_scenario_id ON public.sandbox_events(scenario_id) WHERE scenario_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sandbox_events_entity_type ON public.sandbox_events(entity_type) WHERE entity_type IS NOT NULL;

COMMENT ON COLUMN public.sandbox_events.entity_type IS 'Entity affected: user, employment, reference, dispute, etc.';
COMMENT ON COLUMN public.sandbox_events.sandbox_id IS 'Sandbox company/session id.';
COMMENT ON COLUMN public.sandbox_events.scenario_id IS 'Scenario run id when event is part of a scenario.';

-- Realtime for sandbox monitor
ALTER PUBLICATION supabase_realtime ADD TABLE public.sandbox_events;
