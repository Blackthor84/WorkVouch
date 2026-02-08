-- ============================================================================
-- Intelligence score history (score diff logging) and health events (dashboard)
-- ============================================================================

-- Score diff logging: previous_score, new_score, delta, reason, timestamp, triggered_by
CREATE TABLE IF NOT EXISTS public.intelligence_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('trust_score', 'sandbox')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sandbox_id UUID REFERENCES public.sandbox_sessions(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.sandbox_employees(id) ON DELETE SET NULL,
  previous_score NUMERIC,
  new_score NUMERIC NOT NULL,
  delta NUMERIC,
  reason TEXT NOT NULL,
  triggered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_score_history_user ON public.intelligence_score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_score_history_sandbox ON public.intelligence_score_history(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_score_history_created ON public.intelligence_score_history(created_at);

COMMENT ON TABLE public.intelligence_score_history IS 'Score diff log: previous_score, new_score, delta, reason, triggered_by. Intelligence history.';

-- Health events for dashboard: recalc_success, recalc_fail, fraud_block, overlap_failure
CREATE TABLE IF NOT EXISTS public.intelligence_health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('recalc_success', 'recalc_fail', 'fraud_block', 'overlap_failure')),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_health_events_type ON public.intelligence_health_events(event_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_health_events_created ON public.intelligence_health_events(created_at);

COMMENT ON TABLE public.intelligence_health_events IS 'Integrity health: recalc success/fail, fraud blocks, overlap failures. Payload: context, userId, sandboxId, error, sentiment, etc.';
