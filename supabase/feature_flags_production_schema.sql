-- ============================================================================
-- FEATURE FLAGS (Hidden Features) - Production schema for scale
-- ============================================================================
-- Integrates with: profiles, user_roles, employer_accounts, NextAuth, RLS
-- Only Admin/SuperAdmin can read; only service role can write.
-- ============================================================================

-- Create tables with production schema (run after create_feature_flags_tables.sql if that exists, or standalone for fresh install)
-- If feature_flags already exists from old schema, run the ALTER block at the end.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
    -- Fresh install: create with full production schema
    CREATE TABLE public.feature_flags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      key TEXT NOT NULL UNIQUE,
      description TEXT,
      visibility_type TEXT NOT NULL CHECK (visibility_type IN ('ui', 'api', 'both')) DEFAULT 'both',
      is_globally_enabled BOOLEAN NOT NULL DEFAULT false,
      required_subscription_tier TEXT NULL,
      created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);
    CREATE INDEX idx_feature_flags_globally_enabled ON public.feature_flags(is_globally_enabled);

    CREATE TABLE public.feature_flag_assignments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      feature_flag_id UUID NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
      user_id UUID NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      employer_id UUID NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT assignment_target CHECK (
        (user_id IS NOT NULL AND employer_id IS NULL) OR (user_id IS NULL AND employer_id IS NOT NULL)
      )
    );
    CREATE UNIQUE INDEX idx_unique_flag_user ON public.feature_flag_assignments (feature_flag_id, user_id) WHERE user_id IS NOT NULL;
    CREATE UNIQUE INDEX idx_unique_flag_employer ON public.feature_flag_assignments (feature_flag_id, employer_id) WHERE employer_id IS NOT NULL;
    CREATE INDEX idx_feature_flag_assignments_feature ON public.feature_flag_assignments(feature_flag_id);
    CREATE INDEX idx_feature_flag_assignments_user ON public.feature_flag_assignments(user_id);
    CREATE INDEX idx_feature_flag_assignments_employer ON public.feature_flag_assignments(employer_id);

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
    CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_feature_flag_assignments_updated_at BEFORE UPDATE ON public.feature_flag_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.feature_flag_assignments ENABLE ROW LEVEL SECURITY;

    -- Admin/SuperAdmin can read; no direct client write (service role bypasses RLS for writes)
    CREATE POLICY "Feature flags: admin read"
      ON public.feature_flags FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
      );
    CREATE POLICY "Feature flags: no write"
      ON public.feature_flags FOR ALL
      USING (false)
      WITH CHECK (false);

    CREATE POLICY "Feature flag assignments: admin read"
      ON public.feature_flag_assignments FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
      );
    CREATE POLICY "Feature flag assignments: no write"
      ON public.feature_flag_assignments FOR ALL
      USING (false)
      WITH CHECK (false);

    RAISE NOTICE 'Feature flags production schema created (fresh install).';
  ELSE
    -- Existing table: add production columns and fix schema
    ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS key TEXT;
    UPDATE public.feature_flags SET key = LOWER(REGEXP_REPLACE(COALESCE(TRIM(name), ''), '\s+', '_', 'g')) WHERE key IS NULL;
    UPDATE public.feature_flags SET key = id::text WHERE key IS NULL OR key = '';
    ALTER TABLE public.feature_flags ALTER COLUMN key SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);
    ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS required_subscription_tier TEXT NULL;
    ALTER TABLE public.feature_flags DROP COLUMN IF EXISTS allow_admin_assign;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'visibility_type' AND data_type = 'USER-DEFINED') THEN
      ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS visibility_type_new TEXT DEFAULT 'both';
      UPDATE public.feature_flags SET visibility_type_new = CASE visibility_type::text WHEN 'api_only' THEN 'api' ELSE COALESCE(visibility_type::text, 'both') END;
      ALTER TABLE public.feature_flags DROP COLUMN visibility_type;
      ALTER TABLE public.feature_flags RENAME COLUMN visibility_type_new TO visibility_type;
      ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_visibility_check CHECK (visibility_type IN ('ui', 'api', 'both'));
      ALTER TABLE public.feature_flags ALTER COLUMN visibility_type SET DEFAULT 'both';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'feature_flags' AND constraint_name LIKE '%visibility%') THEN
      ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_visibility_check CHECK (visibility_type IN ('ui', 'api', 'both'));
    END IF;

    DROP POLICY IF EXISTS "Feature flags: service role only" ON public.feature_flags;
    DROP POLICY IF EXISTS "Feature flags: admin read" ON public.feature_flags;
    DROP POLICY IF EXISTS "Feature flags: no write" ON public.feature_flags;
    CREATE POLICY "Feature flags: admin read" ON public.feature_flags FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));
    CREATE POLICY "Feature flags: no write" ON public.feature_flags FOR ALL USING (false) WITH CHECK (false);

    DROP POLICY IF EXISTS "Feature flag assignments: service role only" ON public.feature_flag_assignments;
    DROP POLICY IF EXISTS "Feature flag assignments: admin read" ON public.feature_flag_assignments;
    DROP POLICY IF EXISTS "Feature flag assignments: no write" ON public.feature_flag_assignments;
    CREATE POLICY "Feature flag assignments: admin read" ON public.feature_flag_assignments FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')));
    CREATE POLICY "Feature flag assignments: no write" ON public.feature_flag_assignments FOR ALL USING (false) WITH CHECK (false);

    RAISE NOTICE 'Feature flags production schema applied (existing table altered).';
  END IF;
END $$;
