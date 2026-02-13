-- ============================================================================
-- TRADES TAXONOMY: first-class trades table + profile linkage.
-- Used for candidate filtering, enterprise demos, hiring simulations.
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TRADES: slug + display name
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_slug ON public.trades(slug);

COMMENT ON TABLE public.trades IS 'Taxonomy of trades (Electrician, Plumber, HVAC, etc.) for profile linkage and filtering.';

-- ----------------------------------------------------------------------------
-- 2) PROFILE_TRADES: profile_id + trade_id (many-to-many)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, trade_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_trades_profile_id ON public.profile_trades(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_trades_trade_id ON public.profile_trades(trade_id);

COMMENT ON TABLE public.profile_trades IS 'Employee-selected trades; used for candidate filtering and enterprise demos.';

-- ----------------------------------------------------------------------------
-- 3) SEED COMMON TRADES (idempotent)
-- ----------------------------------------------------------------------------
INSERT INTO public.trades (slug, display_name)
VALUES
  ('electrician', 'Electrician'),
  ('plumber', 'Plumber'),
  ('hvac', 'HVAC'),
  ('carpenter', 'Carpenter'),
  ('welder', 'Welder'),
  ('security_tech', 'Security Tech'),
  ('general_labor', 'General Labor'),
  ('painter', 'Painter'),
  ('roofer', 'Roofer'),
  ('heavy_equipment', 'Heavy Equipment Operator'),
  ('mason', 'Mason'),
  ('drywall', 'Drywall / Finishing'),
  ('concrete', 'Concrete / Cement Mason'),
  ('pipefitter', 'Pipefitter'),
  ('sheet_metal', 'Sheet Metal Worker')
ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name;

-- ----------------------------------------------------------------------------
-- 4) RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trades readable by all authenticated" ON public.trades;
CREATE POLICY "Trades readable by all authenticated"
  ON public.trades FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role trades" ON public.trades;
CREATE POLICY "Service role trades"
  ON public.trades FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage own profile_trades" ON public.profile_trades;
CREATE POLICY "Users manage own profile_trades"
  ON public.profile_trades FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role profile_trades" ON public.profile_trades;
CREATE POLICY "Service role profile_trades"
  ON public.profile_trades FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
