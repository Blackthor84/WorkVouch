-- Saved candidates (employer user id = profiles.id)
CREATE TABLE IF NOT EXISTS public.saved_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_candidates_employer ON public.saved_candidates(employer_id);
CREATE INDEX IF NOT EXISTS idx_saved_candidates_candidate ON public.saved_candidates(candidate_id);

ALTER TABLE public.saved_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can manage own saved candidates" ON public.saved_candidates;
CREATE POLICY "Employers can manage own saved candidates"
  ON public.saved_candidates FOR ALL
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

COMMENT ON TABLE public.saved_candidates IS 'Employer-saved candidates for hiring workflow.';
