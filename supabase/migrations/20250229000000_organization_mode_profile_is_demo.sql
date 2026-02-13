-- Sandbox/demo isolation: organization.mode and profiles.is_demo
-- Used by isSandboxOrg() so demo/fake data never appears in production.

-- organizations.mode: 'production' | 'sandbox'. Default production.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'production'
  CHECK (mode IS NULL OR mode IN ('production', 'sandbox'));

COMMENT ON COLUMN public.organizations.mode IS 'production = real data only; sandbox = demo/sandbox data allowed.';

-- profiles.is_demo: explicit demo user (e.g. demo account or sandbox user)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_demo IS 'When true, user may see demo/sandbox data in allowed contexts.';
