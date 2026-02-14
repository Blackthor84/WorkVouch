-- ============================================================================
-- INTERNAL ANALYTICS — ENTERPRISE SCHEMA
-- Security-grade observability. Admin-only. Sandbox parity. No raw IP.
-- Tables: site_sessions, site_page_views, site_events (session-scoped), abuse_signals.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- site_sessions — one row per browser session (session_token in HttpOnly cookie)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,

  user_id UUID,
  user_role TEXT,

  ip_hash TEXT,
  user_agent TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,

  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  asn TEXT,
  isp TEXT,
  is_vpn BOOLEAN DEFAULT false,

  is_authenticated BOOLEAN NOT NULL DEFAULT false,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_sessions_session_token ON public.site_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_site_sessions_user_id ON public.site_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_site_sessions_last_seen_at ON public.site_sessions(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_sessions_is_sandbox ON public.site_sessions(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_site_sessions_ip_hash ON public.site_sessions(ip_hash);
CREATE INDEX IF NOT EXISTS idx_site_sessions_started_at ON public.site_sessions(started_at DESC);

COMMENT ON TABLE public.site_sessions IS 'Internal analytics: one row per visitor session. IP hashed only. Sandbox-aware. Admin-only read.';

-- ---------------------------------------------------------------------------
-- site_page_views — one row per page view, FK to site_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.site_sessions(id) ON DELETE SET NULL,
  user_id UUID,

  path TEXT NOT NULL,
  referrer TEXT,
  duration_ms INTEGER,

  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_page_views_session_id ON public.site_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_site_page_views_user_id ON public.site_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_site_page_views_created_at ON public.site_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_page_views_is_sandbox ON public.site_page_views(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_site_page_views_path ON public.site_page_views(path);

COMMENT ON TABLE public.site_page_views IS 'Internal analytics: page views per session. Admin-only. Sandbox-aware.';

-- ---------------------------------------------------------------------------
-- site_events (session-scoped) — rename legacy if exists, then create new schema
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_events') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'site_events' AND data_type = 'text' AND column_name = 'session_id') THEN
      ALTER TABLE public.site_events RENAME TO site_events_legacy;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.site_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.site_sessions(id) ON DELETE SET NULL,
  user_id UUID,

  event_type TEXT NOT NULL,
  event_metadata JSONB,

  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_events_session_id ON public.site_events(session_id);
CREATE INDEX IF NOT EXISTS idx_site_events_user_id ON public.site_events(user_id);
CREATE INDEX IF NOT EXISTS idx_site_events_event_type ON public.site_events(event_type);
CREATE INDEX IF NOT EXISTS idx_site_events_created_at ON public.site_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_is_sandbox ON public.site_events(is_sandbox);

COMMENT ON TABLE public.site_events IS 'Internal analytics: discrete events per session. No PII in event_metadata. Admin-only.';

-- ---------------------------------------------------------------------------
-- abuse_signals — security/abuse detection flags
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.abuse_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  signal_type TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  is_sandbox BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abuse_signals_session_id ON public.abuse_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_signal_type ON public.abuse_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_created_at ON public.abuse_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_is_sandbox ON public.abuse_signals(is_sandbox);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_severity ON public.abuse_signals(severity DESC);

COMMENT ON TABLE public.abuse_signals IS 'Abuse/security signals. No PII. Sandbox-isolated. Admin-only read.';

-- ---------------------------------------------------------------------------
-- RLS: service role only (capture APIs and admin dashboard use service role)
-- ---------------------------------------------------------------------------
ALTER TABLE public.site_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only for site_sessions" ON public.site_sessions;
CREATE POLICY "Service role only for site_sessions" ON public.site_sessions FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only for site_page_views" ON public.site_page_views;
CREATE POLICY "Service role only for site_page_views" ON public.site_page_views FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only for site_events" ON public.site_events;
CREATE POLICY "Service role only for site_events" ON public.site_events FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only for abuse_signals" ON public.abuse_signals;
CREATE POLICY "Service role only for abuse_signals" ON public.abuse_signals FOR ALL USING (false);
