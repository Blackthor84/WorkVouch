-- Hiring outcome feedback: employer-submitted hired / would_rehire per candidate.
-- Data is private; never exposed at individual employer level. For future aggregate use only.

CREATE TABLE IF NOT EXISTS public.hiring_outcome_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hired BOOLEAN,
  would_rehire BOOLEAN,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_hiring_outcome_feedback_employer
  ON public.hiring_outcome_feedback(employer_id);
CREATE INDEX IF NOT EXISTS idx_hiring_outcome_feedback_candidate
  ON public.hiring_outcome_feedback(candidate_id);
CREATE INDEX IF NOT EXISTS idx_hiring_outcome_feedback_created
  ON public.hiring_outcome_feedback(created_at);

COMMENT ON TABLE public.hiring_outcome_feedback IS 'Employer hiring outcomes (hired, would_rehire). Private; for aggregate use only.';

ALTER TABLE public.hiring_outcome_feedback ENABLE ROW LEVEL SECURITY;

-- Employers may only insert/update their own rows (employer_id = auth.uid()).
DROP POLICY IF EXISTS "Employers insert own hiring outcome feedback" ON public.hiring_outcome_feedback;
CREATE POLICY "Employers insert own hiring outcome feedback"
  ON public.hiring_outcome_feedback FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Employers update own hiring outcome feedback" ON public.hiring_outcome_feedback;
CREATE POLICY "Employers update own hiring outcome feedback"
  ON public.hiring_outcome_feedback FOR UPDATE
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

-- Employers may select only their own rows (used only to determine if prompt was already submitted; never expose values in UI).
DROP POLICY IF EXISTS "Employers select own hiring outcome feedback" ON public.hiring_outcome_feedback;
CREATE POLICY "Employers select own hiring outcome feedback"
  ON public.hiring_outcome_feedback FOR SELECT
  USING (auth.uid() = employer_id);
