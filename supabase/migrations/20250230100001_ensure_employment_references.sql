-- Ensure employment_references exists (in case 20250129000002 was not run).
-- Peer references tied to confirmed employment_matches. Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.employment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_match_id UUID NOT NULL REFERENCES public.employment_matches(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  reliability_score NUMERIC(5,2),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  flagged BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT employment_references_no_self CHECK (reviewer_id != reviewed_user_id),
  CONSTRAINT employment_references_unique_match_reviewer UNIQUE (employment_match_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_employment_references_match ON public.employment_references(employment_match_id);
CREATE INDEX IF NOT EXISTS idx_employment_references_reviewer ON public.employment_references(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_employment_references_reviewed ON public.employment_references(reviewed_user_id);

ALTER TABLE public.employment_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view employment_references they are part of" ON public.employment_references;
CREATE POLICY "Users can view employment_references they are part of"
  ON public.employment_references FOR SELECT
  USING (reviewer_id = auth.uid() OR reviewed_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert employment_references as reviewer" ON public.employment_references;
CREATE POLICY "Users can insert employment_references as reviewer"
  ON public.employment_references FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

COMMENT ON TABLE public.employment_references IS 'Peer references for confirmed employment matches only. Prevents circular validation.';

-- Add sentiment and trust_weight if missing (from resumes_and_review_trust)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employment_references' AND column_name = 'sentiment') THEN
    ALTER TABLE public.employment_references ADD COLUMN sentiment NUMERIC(3,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employment_references' AND column_name = 'trust_weight') THEN
    ALTER TABLE public.employment_references ADD COLUMN trust_weight NUMERIC(5,2) DEFAULT 1.0;
  END IF;
  COMMENT ON COLUMN public.employment_references.sentiment IS 'Normalized sentiment -1 to 1; derived from comment or rating.';
  COMMENT ON COLUMN public.employment_references.trust_weight IS 'Weight applied in trust score; default 1.0.';
END $$;
