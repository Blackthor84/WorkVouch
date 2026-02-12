-- ============================================================================
-- ENTERPRISE GUARDRAILS: org columns, organization_usage, organization_features, enterprise_signals
-- Additive only. No destructive changes.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) ORGANIZATIONS: add enterprise billing and limit fields
-- ----------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS legal_entity_name TEXT,
  ADD COLUMN IF NOT EXISTS number_of_locations INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS estimated_monthly_hires INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS requires_enterprise BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.legal_entity_name IS 'Legal entity name for contracts.';
COMMENT ON COLUMN public.organizations.number_of_locations IS 'Current location count; enforce vs plan limit.';
COMMENT ON COLUMN public.organizations.estimated_monthly_hires IS 'Estimated monthly hires for plan sizing.';
COMMENT ON COLUMN public.organizations.requires_enterprise IS 'Soft flag: over plan limits; show upgrade, do not disable.';

-- plan_type already exists (text). Ensure we have an index for plan checks.
CREATE INDEX IF NOT EXISTS idx_organizations_requires_enterprise ON public.organizations(requires_enterprise) WHERE requires_enterprise = true;

-- ----------------------------------------------------------------------------
-- 2) ORGANIZATION_USAGE: monthly unlock and snapshot tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  unlock_count INTEGER NOT NULL DEFAULT 0,
  admin_count_snapshot INTEGER,
  location_count_snapshot INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, month)
);

CREATE INDEX IF NOT EXISTS idx_organization_usage_org_month ON public.organization_usage(organization_id, month);

COMMENT ON TABLE public.organization_usage IS 'Monthly usage per org: unlock count and snapshots for plan enforcement.';

-- ----------------------------------------------------------------------------
-- 3) ORGANIZATION_FEATURES: feature flags per plan
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  bulk_upload_enabled BOOLEAN NOT NULL DEFAULT false,
  api_access_enabled BOOLEAN NOT NULL DEFAULT false,
  multi_location_enabled BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  advanced_analytics BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_features_org ON public.organization_features(organization_id);

COMMENT ON TABLE public.organization_features IS 'Feature flags per org; auto-populated from plan_type.';

-- ----------------------------------------------------------------------------
-- 4) ENTERPRISE_SIGNALS: sales intelligence when thresholds exceeded
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE enterprise_signal_type_enum AS ENUM (
    'volume_spike',
    'seat_overflow',
    'location_overflow',
    'unlock_overflow'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.enterprise_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  value NUMERIC,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_signals_org ON public.enterprise_signals(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_signals_triggered ON public.enterprise_signals(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_signals_unresolved ON public.enterprise_signals(organization_id) WHERE resolved = false;

COMMENT ON TABLE public.enterprise_signals IS 'Signals when org exceeds plan limits; for sales/upgrade.';

-- ----------------------------------------------------------------------------
-- 5) RLS for new tables (read by org members / service role)
-- ----------------------------------------------------------------------------
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org usage visible to org" ON public.organization_usage;
CREATE POLICY "Org usage visible to org"
  ON public.organization_usage FOR SELECT
  USING (
    organization_id IN (SELECT public.current_user_enterprise_org_ids())
    OR organization_id IN (SELECT organization_id FROM public.employer_users WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Superadmin organization_usage" ON public.organization_usage;
CREATE POLICY "Superadmin organization_usage"
  ON public.organization_usage FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

DROP POLICY IF EXISTS "Org features visible to org" ON public.organization_features;
CREATE POLICY "Org features visible to org"
  ON public.organization_features FOR SELECT
  USING (
    organization_id IN (SELECT public.current_user_enterprise_org_ids())
    OR organization_id IN (SELECT organization_id FROM public.employer_users WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Superadmin organization_features" ON public.organization_features;
CREATE POLICY "Superadmin organization_features"
  ON public.organization_features FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

DROP POLICY IF EXISTS "Org signals visible to org" ON public.enterprise_signals;
CREATE POLICY "Org signals visible to org"
  ON public.enterprise_signals FOR SELECT
  USING (
    organization_id IN (SELECT public.current_user_enterprise_org_ids())
    OR organization_id IN (SELECT organization_id FROM public.employer_users WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Superadmin enterprise_signals" ON public.enterprise_signals;
CREATE POLICY "Superadmin enterprise_signals"
  ON public.enterprise_signals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

COMMIT;
