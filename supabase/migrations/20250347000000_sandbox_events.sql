-- Sandbox Activity Monitor: event log for Playground actions. Admin-only read.
CREATE TABLE IF NOT EXISTS public.sandbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  actor TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_events_created_at ON public.sandbox_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sandbox_events_type ON public.sandbox_events(type);

COMMENT ON TABLE public.sandbox_events IS 'Activity log for sandbox Playground. GET /api/sandbox/events reads here.';
