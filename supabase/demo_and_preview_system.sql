-- Demo & Investor Simulation System: demo_account flag + preview_sessions table.
-- Run in Supabase SQL Editor. Idempotent.

-- 1. profiles: demo_account flag (auto-expirable demo accounts)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS demo_account BOOLEAN NOT NULL DEFAULT false;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. employer_accounts: demo_account flag
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employer_accounts') THEN
    ALTER TABLE public.employer_accounts ADD COLUMN IF NOT EXISTS demo_account BOOLEAN NOT NULL DEFAULT false;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. preview_sessions: shareable preview links (expiring tokens)
CREATE TABLE IF NOT EXISTS public.preview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  preview_role TEXT NOT NULL DEFAULT 'employer',
  preview_plan TEXT NOT NULL DEFAULT 'pro',
  preview_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preview_sessions_token ON public.preview_sessions(token);
CREATE INDEX IF NOT EXISTS idx_preview_sessions_expires_at ON public.preview_sessions(expires_at);

ALTER TABLE public.preview_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage preview_sessions (admin APIs use service role)
DROP POLICY IF EXISTS "service_role_preview_sessions" ON public.preview_sessions;
CREATE POLICY "service_role_preview_sessions"
  ON public.preview_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE public.preview_sessions IS 'Temporary shareable preview links for investors/sales. Read-only simulation.';
