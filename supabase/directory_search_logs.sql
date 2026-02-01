-- directory_search_logs: audit employer directory searches for analytics and employee visibility.
-- directory_search_result_profiles: which profiles were in each search result (for "who viewed me").

CREATE TABLE IF NOT EXISTS public.directory_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  filters_used JSONB NOT NULL DEFAULT '{}',
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_directory_search_logs_employer_id ON public.directory_search_logs(employer_id);
CREATE INDEX IF NOT EXISTS idx_directory_search_logs_created_at ON public.directory_search_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.directory_search_result_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_log_id UUID NOT NULL REFERENCES public.directory_search_logs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_directory_search_result_profiles_search_log_id ON public.directory_search_result_profiles(search_log_id);
CREATE INDEX IF NOT EXISTS idx_directory_search_result_profiles_profile_id ON public.directory_search_result_profiles(profile_id);

ALTER TABLE public.directory_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_search_result_profiles ENABLE ROW LEVEL SECURITY;

-- Service role (backend) bypasses RLS for insert. Policy for SELECT only.
DROP POLICY IF EXISTS "Employers can read own search logs" ON public.directory_search_logs;
CREATE POLICY "Employers can read own search logs"
  ON public.directory_search_logs FOR SELECT
  USING (
    employer_id IN (
      SELECT id FROM public.employer_accounts WHERE user_id = auth.uid()
    )
  );

-- Result profiles: employees can read rows where profile_id = self (for "who viewed me").
DROP POLICY IF EXISTS "Users can read own result profile rows" ON public.directory_search_result_profiles;
CREATE POLICY "Users can read own result profile rows"
  ON public.directory_search_result_profiles FOR SELECT
  USING (profile_id = auth.uid());

COMMENT ON TABLE public.directory_search_logs IS 'Audit log of employer directory searches; used for analytics and employee visibility.';
COMMENT ON TABLE public.directory_search_result_profiles IS 'Which profiles appeared in each search result; used for employee "who viewed me" metrics.';
