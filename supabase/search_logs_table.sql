-- Audit log: employer search attempts (which profile was viewed by which employer).

CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  searched_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_employer_id ON public.search_logs(employer_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_profile_id ON public.search_logs(searched_profile_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON public.search_logs(created_at DESC);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Only service role inserts; employers can read own logs for audit.
DROP POLICY IF EXISTS "Employers can read own search_logs" ON public.search_logs;
CREATE POLICY "Employers can read own search_logs"
  ON public.search_logs FOR SELECT
  USING (
    employer_id IN (
      SELECT id FROM public.employer_accounts WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.search_logs IS 'Audit: which employer searched/viewed which profile. No client direct access.';
