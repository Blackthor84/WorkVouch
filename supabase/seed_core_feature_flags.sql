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
