-- Feature flag: enterprise_intelligence (team fit, hiring confidence, fraud confidence, workforce analytics)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'key') THEN
    INSERT INTO public.feature_flags (name, key, description, is_globally_enabled, visibility_type, required_subscription_tier, created_at, updated_at)
    SELECT 'Enterprise Intelligence', 'enterprise_intelligence', 'Team fit, hiring confidence, fraud confidence, workforce trend analytics', false, 'ui', 'emp_enterprise', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'enterprise_intelligence');
  ELSE
    INSERT INTO public.feature_flags (name, description, is_globally_enabled, visibility_type, created_at, updated_at)
    SELECT 'Enterprise Intelligence', 'Team fit, hiring confidence, fraud confidence, workforce trend analytics', false, 'ui', NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE name = 'Enterprise Intelligence');
  END IF;
END $$;
