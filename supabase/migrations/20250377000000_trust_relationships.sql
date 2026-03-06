-- ============================================================================
-- TRUST GRAPH: trust_relationships
-- Connects references and verified employment into a single graph.
-- All IDs reference profiles.id (identity root).
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE trust_relationship_type_enum AS ENUM (
    'peer_reference',
    'manager_confirmation',
    'coworker_overlap',
    'verified_employment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trust_verification_level_enum AS ENUM (
    'pending',
    'confirmed',
    'verified'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.trust_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type trust_relationship_type_enum NOT NULL,
  verification_level trust_verification_level_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trust_relationships_no_self CHECK (source_profile_id != target_profile_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_relationships_source_target_type
  ON public.trust_relationships(source_profile_id, target_profile_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_trust_relationships_target ON public.trust_relationships(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_trust_relationships_type ON public.trust_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_trust_relationships_created ON public.trust_relationships(created_at DESC);

COMMENT ON TABLE public.trust_relationships IS 'Trust graph: edges between profiles from references and verified employment.';

ALTER TABLE public.trust_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view trust_relationships they are part of" ON public.trust_relationships;
CREATE POLICY "Users can view trust_relationships they are part of"
  ON public.trust_relationships FOR SELECT
  USING (source_profile_id = auth.uid() OR target_profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access trust_relationships" ON public.trust_relationships;
CREATE POLICY "Service role full access trust_relationships"
  ON public.trust_relationships FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Backfill from user_references (peer references: from -> to)
-- ----------------------------------------------------------------------------
INSERT INTO public.trust_relationships (source_profile_id, target_profile_id, relationship_type, verification_level, created_at)
SELECT
  ur.from_user_id,
  ur.to_user_id,
  CASE WHEN ur.relationship_type = 'supervisor' THEN 'manager_confirmation'::trust_relationship_type_enum ELSE 'peer_reference'::trust_relationship_type_enum END,
  'confirmed'::trust_verification_level_enum,
  ur.created_at
FROM public.user_references ur
WHERE ur.is_deleted = false
  AND ur.from_user_id != ur.to_user_id
ON CONFLICT (source_profile_id, target_profile_id, relationship_type) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Backfill from employment_references (peer verification: reviewer -> reviewed)
-- ----------------------------------------------------------------------------
INSERT INTO public.trust_relationships (source_profile_id, target_profile_id, relationship_type, verification_level, created_at)
SELECT
  er.reviewer_id,
  er.reviewed_user_id,
  'peer_reference'::trust_relationship_type_enum,
  'verified'::trust_verification_level_enum,
  er.created_at
FROM public.employment_references er
WHERE er.reviewer_id != er.reviewed_user_id
ON CONFLICT (source_profile_id, target_profile_id, relationship_type) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Backfill from employment_matches (coworker overlap: record owner <-> matched_user)
-- Bidirectional: (owner, matched) and (matched, owner)
-- ----------------------------------------------------------------------------
INSERT INTO public.trust_relationships (source_profile_id, target_profile_id, relationship_type, verification_level, created_at)
SELECT
  rec.user_id,
  m.matched_user_id,
  'coworker_overlap'::trust_relationship_type_enum,
  CASE WHEN m.match_status = 'confirmed' THEN 'verified'::trust_verification_level_enum ELSE 'pending'::trust_verification_level_enum END,
  m.created_at
FROM public.employment_matches m
JOIN public.employment_records rec ON rec.id = m.employment_record_id
WHERE rec.user_id != m.matched_user_id
ON CONFLICT (source_profile_id, target_profile_id, relationship_type) DO NOTHING;

INSERT INTO public.trust_relationships (source_profile_id, target_profile_id, relationship_type, verification_level, created_at)
SELECT
  m.matched_user_id,
  rec.user_id,
  'coworker_overlap'::trust_relationship_type_enum,
  CASE WHEN m.match_status = 'confirmed' THEN 'verified'::trust_verification_level_enum ELSE 'pending'::trust_verification_level_enum END,
  m.created_at
FROM public.employment_matches m
JOIN public.employment_records rec ON rec.id = m.employment_record_id
WHERE rec.user_id != m.matched_user_id
ON CONFLICT (source_profile_id, target_profile_id, relationship_type) DO NOTHING;
