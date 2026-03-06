-- ============================================================================
-- TRUST TIMELINE: trust_events impact + metadata, backfill from source tables
-- ============================================================================

-- Add impact and metadata to trust_events (keep payload for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_events' AND column_name = 'impact') THEN
    ALTER TABLE public.trust_events ADD COLUMN impact TEXT DEFAULT 'neutral'
      CHECK (impact IS NULL OR impact IN ('positive', 'neutral', 'negative'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_events' AND column_name = 'metadata') THEN
    ALTER TABLE public.trust_events ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trust_events_impact ON public.trust_events(impact) WHERE impact IS NOT NULL;

COMMENT ON COLUMN public.trust_events.impact IS 'User-facing impact: positive, neutral, negative.';
COMMENT ON COLUMN public.trust_events.metadata IS 'Event-specific payload (company_name, rating, dispute_type, etc.).';

-- ----------------------------------------------------------------------------
-- Backfill: verifications (employment_records verified)
-- ----------------------------------------------------------------------------
INSERT INTO public.trust_events (profile_id, event_type, impact, metadata, created_at)
SELECT er.user_id, 'verification', 'positive',
  jsonb_build_object('company_name', er.company_name, 'job_title', er.job_title, 'source', 'employment_record'),
  er.updated_at
FROM public.employment_records er
WHERE er.verification_status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM public.trust_events te
    WHERE te.profile_id = er.user_id AND te.event_type = 'verification'
      AND te.metadata->>'company_name' = er.company_name AND te.created_at::date = er.updated_at::date
  );

-- ----------------------------------------------------------------------------
-- Backfill: references (user_references received)
-- ----------------------------------------------------------------------------
INSERT INTO public.trust_events (profile_id, event_type, impact, metadata, created_at)
SELECT ur.to_user_id, 'reference', 'positive',
  jsonb_build_object('rating', ur.rating, 'source', 'user_reference'),
  ur.created_at
FROM public.user_references ur
WHERE ur.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public.trust_events te
    WHERE te.profile_id = ur.to_user_id AND te.event_type = 'reference'
      AND te.metadata->>'source' = 'user_reference' AND te.created_at::date = ur.created_at::date
  );

INSERT INTO public.trust_events (profile_id, event_type, impact, metadata, created_at)
SELECT er.reviewed_user_id, 'reference', 'positive',
  jsonb_build_object('rating', er.rating, 'source', 'employment_reference'),
  er.created_at
FROM public.employment_references er
WHERE NOT EXISTS (
  SELECT 1 FROM public.trust_events te
  WHERE te.profile_id = er.reviewed_user_id AND te.event_type = 'reference'
    AND te.metadata->>'source' = 'employment_reference' AND te.created_at::date = er.created_at::date
);

-- ----------------------------------------------------------------------------
-- Backfill: disputes (compliance_disputes by profile_id)
-- ----------------------------------------------------------------------------
INSERT INTO public.trust_events (profile_id, event_type, impact, metadata, created_at)
SELECT cd.profile_id, 'dispute',
  CASE WHEN cd.status = 'Resolved' THEN 'neutral' ELSE 'negative' END,
  jsonb_build_object('dispute_type', cd.dispute_type, 'status', cd.status, 'description', LEFT(cd.description, 200)),
  cd.created_at
FROM public.compliance_disputes cd
WHERE NOT EXISTS (
  SELECT 1 FROM public.trust_events te
  WHERE te.profile_id = cd.profile_id AND te.event_type = 'dispute' AND te.created_at::date = cd.created_at::date
);

-- ----------------------------------------------------------------------------
-- Backfill: credential_share (credential issued + views)
-- ----------------------------------------------------------------------------
INSERT INTO public.trust_events (profile_id, event_type, impact, metadata, created_at)
SELECT wc.candidate_id, 'credential_share', 'neutral',
  jsonb_build_object('credential_id', wc.id, 'visibility', wc.visibility, 'kind', 'issued'),
  wc.issued_at
FROM public.workvouch_credentials wc
WHERE NOT EXISTS (
  SELECT 1 FROM public.trust_events te
  WHERE te.profile_id = wc.candidate_id AND te.event_type = 'credential_share'
    AND te.metadata->>'credential_id' = wc.id::text AND te.metadata->>'kind' = 'issued'
);

INSERT INTO public.trust_events (profile_id, event_type, impact, metadata, created_at)
SELECT wc.candidate_id, 'credential_share', 'neutral',
  jsonb_build_object('credential_id', wc.id, 'view_context', cva.context, 'kind', 'view'),
  cva.created_at
FROM public.credential_views_audit cva
JOIN public.workvouch_credentials wc ON wc.id = cva.workvouch_credential_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.trust_events te
  WHERE te.profile_id = wc.candidate_id AND te.event_type = 'credential_share'
    AND te.metadata->>'kind' = 'view' AND te.created_at = cva.created_at
);
