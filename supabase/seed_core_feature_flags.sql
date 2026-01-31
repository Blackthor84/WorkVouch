-- Seed core feature flags if they do not exist (run in Supabase SQL editor or migration).
-- Keys: ads_system, beta_access, advanced_analytics

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Ads System', 'ads_system', 'Admin advertising dashboard and ad management', 'both', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'ads_system');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Beta Access', 'beta_access', 'Access to beta features and pages', 'both', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'beta_access');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Advanced Analytics', 'advanced_analytics', 'Premium hiring analytics on employer dashboard', 'both', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'advanced_analytics');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Risk Snapshot', 'risk_snapshot', 'Smart candidate risk snapshot engine (silent compute)', 'both', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'risk_snapshot');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Rehire Internal', 'rehire_internal', 'Internal rehire status per employer-candidate', 'both', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'rehire_internal');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Workforce Risk Dashboard', 'workforce_risk_dashboard', 'Admin workforce risk dashboard (demo)', 'ui', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'workforce_risk_dashboard');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Smart Risk Snapshot', 'smart_risk_snapshot', 'Enterprise risk snapshot (backend only)', 'ui', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'smart_risk_snapshot');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Team Fit Engine', 'team_fit_engine', 'Team fit scoring (backend only)', 'ui', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'team_fit_engine');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Rehire Probability Engine', 'rehire_probability_engine', 'Rehire probability scoring (backend only)', 'ui', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'rehire_probability_engine');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Industry Normalized Scoring', 'industry_normalized_scoring', 'Industry-normalized trust, stability, workforce (backend only)', 'ui', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'industry_normalized_scoring');

INSERT INTO public.feature_flags (name, key, description, visibility_type, is_globally_enabled)
SELECT 'Risk Model Visible', 'risk_model_visible', 'When enabled, UI may read risk_score (future)', 'ui', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'risk_model_visible');
