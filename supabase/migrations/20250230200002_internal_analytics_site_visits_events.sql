-- ============================================================================
-- INTERNAL ANALYTICS — site_visits (page views) + site_events (discrete events).
-- GDPR/CCPA: store only hashed IP (ip_hash). No raw IP. No PII in event metadata.
-- Sandbox-aware: is_sandbox on every row. Admin-only read. Capture via API.
-- ============================================================================

-- Page views / visits: one row per view, session-scoped
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  role TEXT,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  device_type TEXT,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON public.site_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_user_id ON public.site_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_is_sandbox ON public.site_visits(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON public.site_visits(path);
CREATE INDEX IF NOT EXISTS idx_site_visits_country ON public.site_visits(country);

COMMENT ON TABLE public.site_visits IS 'Internal analytics: page views. IP stored as hash only. Sandbox-aware. Admin-only read.';
COMMENT ON COLUMN public.site_visits.ip_hash IS 'SHA-256 hash of IP + salt. No raw IP storage (GDPR/CCPA).';

-- Discrete events (clicks, form submits, errors — no PII in metadata)
CREATE TABLE IF NOT EXISTS public.site_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  role TEXT,
  event_name TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  device_type TEXT,
  metadata JSONB,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_events_session_id ON public.site_events(session_id);
CREATE INDEX IF NOT EXISTS idx_site_events_user_id ON public.site_events(user_id);
CREATE INDEX IF NOT EXISTS idx_site_events_event_name ON public.site_events(event_name);
CREATE INDEX IF NOT EXISTS idx_site_events_created_at ON public.site_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_is_sandbox ON public.site_events(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_site_events_path ON public.site_events(path);

COMMENT ON TABLE public.site_events IS 'Internal analytics: discrete events. No PII in metadata. IP hashed. Sandbox-aware. Admin-only read.';

-- RLS: no direct public access. Inserts via service role (capture API). Reads via admin only (dashboard APIs use service role with admin check).
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

-- No SELECT for anon/authenticated; only service role can read/write (used by capture API and admin analytics APIs)
CREATE POLICY "Service role only for site_visits" ON public.site_visits
  FOR ALL USING (false);

CREATE POLICY "Service role only for site_events" ON public.site_events
  FOR ALL USING (false);
