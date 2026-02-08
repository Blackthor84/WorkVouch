-- ============================================================================
-- Multi-vertical support: platform_verticals + vertical columns (non-breaking)
-- Scoring stays unified in lib/core/intelligence; vertical modifiers applied post-breakdown.
-- ============================================================================

-- 1. Platform verticals (enable/disable per vertical)
CREATE TABLE IF NOT EXISTS public.platform_verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_verticals_enabled ON public.platform_verticals(enabled);
CREATE INDEX IF NOT EXISTS idx_platform_verticals_name ON public.platform_verticals(name);

INSERT INTO public.platform_verticals (name, enabled) VALUES
  ('default', true),
  ('education', false),
  ('construction', false)
ON CONFLICT (name) DO NOTHING;

-- 2. Sandbox employers: vertical + optional vertical metadata (education/construction)
ALTER TABLE public.sandbox_employers
  ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS vertical_metadata JSONB;

COMMENT ON COLUMN public.sandbox_employers.vertical IS 'Vertical key: default, education, construction. Used for score modifiers only.';
COMMENT ON COLUMN public.sandbox_employers.vertical_metadata IS 'Optional vertical-specific metadata (e.g. education/construction fields). Non-breaking.';

-- 3. Sandbox employees: optional vertical + metadata (for future per-employee vertical)
ALTER TABLE public.sandbox_employees
  ADD COLUMN IF NOT EXISTS vertical TEXT,
  ADD COLUMN IF NOT EXISTS vertical_metadata JSONB;

COMMENT ON COLUMN public.sandbox_employees.vertical IS 'Optional vertical key. If null, inherits from employer context or default.';
COMMENT ON COLUMN public.sandbox_employees.vertical_metadata IS 'Optional vertical-specific metadata. Non-breaking.';

-- 4. Production employer_accounts: vertical + optional metadata
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS vertical_metadata JSONB;

COMMENT ON COLUMN public.employer_accounts.vertical IS 'Vertical key: default, education, construction.';
COMMENT ON COLUMN public.employer_accounts.vertical_metadata IS 'Optional vertical-specific metadata. Non-breaking.';

-- 5. Production profiles (employees): optional vertical + metadata
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vertical TEXT,
  ADD COLUMN IF NOT EXISTS vertical_metadata JSONB;

COMMENT ON COLUMN public.profiles.vertical IS 'Optional vertical key for labor-market context.';
COMMENT ON COLUMN public.profiles.vertical_metadata IS 'Optional vertical-specific metadata. Non-breaking.';
