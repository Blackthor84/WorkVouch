-- ============================================================================
-- CANONICAL USER LOCATION — heat map data model (privacy-safe).
-- Allowed: country (ISO-2), state (US only). Forbidden: city, zip, lat/lng, IP.
-- US locations require state. One row per user (upserted from profile or coarse geo).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- US locations MUST have state (write-time + DB enforcement)
ALTER TABLE public.user_locations
  ADD CONSTRAINT user_locations_us_requires_state
  CHECK (
    (country <> 'US') OR (state IS NOT NULL AND state <> '' AND trim(state) <> '')
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_country ON public.user_locations(country);
CREATE INDEX IF NOT EXISTS idx_user_locations_country_state ON public.user_locations(country, state);

COMMENT ON TABLE public.user_locations IS 'Canonical location for heat map: country + US state only. No city, zip, GPS, or IP.';
COMMENT ON COLUMN public.user_locations.country IS 'ISO-2 country code (e.g. US).';
COMMENT ON COLUMN public.user_locations.state IS 'US state only (e.g. CA). Required when country = US.';

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Only service role / backend writes; reads for heat map aggregation via service role
CREATE POLICY "Service role only for user_locations" ON public.user_locations FOR ALL USING (false);
