-- ============================================================================
-- intelligence_snapshots: profile strength & career health (user-facing metrics)
-- RLS: users select own row; service role insert/update.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_strength NUMERIC(5,2) NOT NULL DEFAULT 0,
  career_health_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  tenure_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  reference_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rehire_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  dispute_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  network_density_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_user ON public.intelligence_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_last_calc ON public.intelligence_snapshots(last_calculated_at);

COMMENT ON TABLE public.intelligence_snapshots IS 'Profile strength and career health; computed server-side. Users see own row only.';

-- updated_at trigger (tagged $ quoting)
DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $mig$;

DROP TRIGGER IF EXISTS intelligence_snapshots_updated_at ON public.intelligence_snapshots;
CREATE TRIGGER intelligence_snapshots_updated_at
  BEFORE UPDATE ON public.intelligence_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: users can select only their own row; service role bypasses RLS for insert/update
ALTER TABLE public.intelligence_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own intelligence_snapshot" ON public.intelligence_snapshots;
CREATE POLICY "Users can select own intelligence_snapshot"
  ON public.intelligence_snapshots FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE policy for anon/authenticated = only service role can write
