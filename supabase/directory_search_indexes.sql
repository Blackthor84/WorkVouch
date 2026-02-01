-- Indexes for performant directory search.

CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON public.profiles(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON public.profiles(visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_profiles_city_state ON public.profiles(city, state);

-- jobs table: company_name for employer filter (current/past employer)
CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON public.jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);

-- trust_scores for profile strength
CREATE INDEX IF NOT EXISTS idx_trust_scores_user_id_calculated ON public.trust_scores(user_id, calculated_at DESC);
