-- ============================================================================
-- LOCATIONS: Ensure required columns exist (migration-safe, no DROP, no data loss)
-- ============================================================================

-- If table does not exist, create it with required columns.
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table exists but city/state are missing, add them.
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS state TEXT;
