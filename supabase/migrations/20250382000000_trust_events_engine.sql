-- ============================================================================
-- Trust Event Engine: event_source, impact_score for score calculation
-- ============================================================================

-- Add event_source and impact_score to trust_events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_events' AND column_name = 'event_source') THEN
    ALTER TABLE public.trust_events ADD COLUMN event_source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_events' AND column_name = 'impact_score') THEN
    ALTER TABLE public.trust_events ADD COLUMN impact_score NUMERIC NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trust_events_event_source ON public.trust_events(event_source) WHERE event_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trust_events_impact_score ON public.trust_events(profile_id, impact_score);

COMMENT ON COLUMN public.trust_events.event_source IS 'Origin: employment_verification, reference_creation, verification_request_accepted, dispute_resolution, credential_sharing.';
COMMENT ON COLUMN public.trust_events.impact_score IS 'Numeric impact; summed per profile for trust score.';

-- Backfill impact_score from impact (positive=10, neutral=0, negative=-10) where impact_score is 0 and impact is set
UPDATE public.trust_events
SET impact_score = CASE
  WHEN impact = 'positive' THEN 10
  WHEN impact = 'negative' THEN -10
  ELSE 0
END
WHERE (impact_score = 0 OR impact_score IS NULL)
  AND impact IS NOT NULL;

UPDATE public.trust_events SET impact_score = 0 WHERE impact_score IS NULL;
