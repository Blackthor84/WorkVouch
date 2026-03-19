-- Track employer profile views for paywall (free tier: 5 views/day)
CREATE TABLE IF NOT EXISTS public.employer_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_profile_views_employer_date ON public.employer_profile_views(employer_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_employer_profile_views_candidate ON public.employer_profile_views(candidate_id);

ALTER TABLE public.employer_profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can insert own profile views"
  ON public.employer_profile_views FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can read own profile views"
  ON public.employer_profile_views FOR SELECT
  USING (auth.uid() = employer_id);

COMMENT ON TABLE public.employer_profile_views IS 'Tracks candidate profile views by employers for free-tier daily limit (e.g. 5/day).';
