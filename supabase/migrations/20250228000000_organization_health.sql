-- ============================================================================
-- organization_health: silent company-level health score (server/super_admin only)
-- Not visible to orgs or users. Used for admin, abuse context, future gating.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_health (
  organization_id UUID NOT NULL PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  band TEXT NOT NULL CHECK (band IN ('trusted', 'monitor', 'review')),
  signals JSONB NOT NULL DEFAULT '{}',
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.organization_health IS 'Internal org health score. Server-side only; not exposed to organizations or users.';

CREATE INDEX IF NOT EXISTS idx_organization_health_band ON public.organization_health(band);
CREATE INDEX IF NOT EXISTS idx_organization_health_last_calculated ON public.organization_health(last_calculated_at DESC);

ALTER TABLE public.organization_health ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write (no org-level access)
CREATE POLICY "Service role full access organization_health"
  ON public.organization_health
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
