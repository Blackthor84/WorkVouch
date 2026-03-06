-- ============================================================================
-- Trust Network: verification_source, strength, depth bands (minimal/moderate/strong/exceptional)
-- All relationships from: employment overlaps, verified references, manager/coworker confirmations.
-- ============================================================================

-- 1) Add verification_source and strength to trust_relationships (keep existing columns)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_relationships' AND column_name = 'verification_source') THEN
    ALTER TABLE public.trust_relationships ADD COLUMN verification_source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_relationships' AND column_name = 'strength') THEN
    ALTER TABLE public.trust_relationships ADD COLUMN strength INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Allowed: employment_overlap, reference, mutual_confirmation, credential
ALTER TABLE public.trust_relationships
  DROP CONSTRAINT IF EXISTS trust_relationships_verification_source_check;
ALTER TABLE public.trust_relationships
  ADD CONSTRAINT trust_relationships_verification_source_check
  CHECK (verification_source IS NULL OR verification_source IN ('employment_overlap', 'reference', 'mutual_confirmation', 'credential'));

COMMENT ON COLUMN public.trust_relationships.verification_source IS 'Source: employment_overlap, reference, mutual_confirmation, credential.';
COMMENT ON COLUMN public.trust_relationships.strength IS 'Edge strength 1+; higher for manager/verified.';

-- Backfill verification_source from relationship_type
UPDATE public.trust_relationships
SET verification_source = CASE
  WHEN relationship_type = 'peer_reference' OR relationship_type = 'manager_confirmation' THEN 'reference'
  WHEN relationship_type = 'coworker_overlap' THEN 'employment_overlap'
  ELSE 'mutual_confirmation'
END
WHERE verification_source IS NULL;

-- 2) Indexes for user_a/user_b style queries (we use source_profile_id = user_a, target_profile_id = user_b)
-- Already exist: idx_trust_relationships_source, idx_trust_relationships_target, idx_trust_relationships_source_target_type
CREATE INDEX IF NOT EXISTS idx_trust_relationships_user_b ON public.trust_relationships(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_trust_relationships_source_created ON public.trust_relationships(source_profile_id, created_at DESC);

-- 3) calculate_trust_graph_depth(profile_id) → depth_band, connection_count, manager_count, verified_employment_links
-- Bands: connections < 2 → minimal, 3–5 → moderate, 6–10 → strong, >10 → exceptional
CREATE OR REPLACE FUNCTION public.calculate_trust_graph_depth(p_profile_id UUID)
RETURNS TABLE (
  depth_band TEXT,
  connection_count BIGINT,
  manager_count BIGINT,
  verified_employment_links BIGINT,
  number_of_verified_connections BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH edges AS (
    SELECT
      source_profile_id,
      target_profile_id,
      relationship_type,
      verification_level
    FROM public.trust_relationships
    WHERE source_profile_id = p_profile_id OR target_profile_id = p_profile_id
  ),
  counts AS (
    SELECT
      COUNT(*)::BIGINT AS connection_count,
      COUNT(*) FILTER (WHERE relationship_type = 'manager_confirmation')::BIGINT AS manager_count,
      COUNT(*) FILTER (WHERE relationship_type = 'coworker_overlap' AND verification_level = 'verified')::BIGINT AS verified_employment_links,
      COUNT(*) FILTER (WHERE verification_level IN ('confirmed', 'verified'))::BIGINT AS number_of_verified_connections
    FROM edges
  )
  SELECT
    CASE
      WHEN c.connection_count < 2 THEN 'minimal'::TEXT
      WHEN c.connection_count <= 5 THEN 'moderate'::TEXT
      WHEN c.connection_count <= 10 THEN 'strong'::TEXT
      ELSE 'exceptional'::TEXT
    END,
    c.connection_count,
    c.manager_count,
    c.verified_employment_links,
    c.number_of_verified_connections
  FROM counts c;
$$;

COMMENT ON FUNCTION public.calculate_trust_graph_depth IS 'Trust graph depth for a profile. Bands: minimal (<2), moderate (3-5), strong (6-10), exceptional (>10). No full table scan.';

-- 4) Trigger: create trust_relationship when reference is submitted (Section 2)
CREATE OR REPLACE FUNCTION public.trigger_trust_relationship_on_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.from_user_id = NEW.to_user_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.trust_relationships (
    source_profile_id,
    target_profile_id,
    relationship_type,
    verification_level,
    verification_source,
    strength
  ) VALUES (
    NEW.from_user_id,
    NEW.to_user_id,
    CASE WHEN NEW.relationship_type = 'supervisor' THEN 'manager_confirmation'::trust_relationship_type_enum ELSE 'peer_reference'::trust_relationship_type_enum END,
    'confirmed'::trust_verification_level_enum,
    'reference',
    1
  )
  ON CONFLICT (source_profile_id, target_profile_id, relationship_type) DO UPDATE SET
    verification_level = 'confirmed',
    verification_source = 'reference';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trust_relationship_on_reference ON public.user_references;
CREATE TRIGGER trust_relationship_on_reference
  AFTER INSERT ON public.user_references
  FOR EACH ROW
  WHEN (NEW.is_deleted = false)
  EXECUTE FUNCTION public.trigger_trust_relationship_on_reference();
