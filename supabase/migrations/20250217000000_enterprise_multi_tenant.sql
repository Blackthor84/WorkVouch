-- ============================================================================
-- ENTERPRISE MULTI-TENANT ARCHITECTURE
-- Organizations (parent) → Locations (child) → Departments
-- Tenant memberships: Enterprise Owner, Location Admin, Recruiter
-- Usage tracking per location, aggregated to organization.
-- Scale: 1,000+ enterprises, 50+ locations each.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE enterprise_role_enum AS ENUM (
    'enterprise_owner',
    'location_admin',
    'recruiter'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_tier_enum AS ENUM (
    'starter',
    'professional',
    'enterprise',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS (parent accounts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  billing_tier billing_tier_enum NOT NULL DEFAULT 'professional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_billing_tier ON public.organizations(billing_tier);

COMMENT ON TABLE public.organizations IS 'Enterprise parent accounts; 1,000+ scale.';
COMMENT ON COLUMN public.organizations.billing_tier IS 'Starter, professional, enterprise, custom.';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_locations_updated_at ON public.locations;
CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_departments_updated_at ON public.departments;
CREATE TRIGGER set_departments_updated_at
  BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_tenant_memberships_updated_at ON public.tenant_memberships;
CREATE TRIGGER set_tenant_memberships_updated_at
  BEFORE UPDATE ON public.tenant_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- LOCATIONS (child accounts; sub-accounts under organization)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON public.locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_slug ON public.locations(organization_id, slug);

COMMENT ON TABLE public.locations IS 'Sub-accounts per organization; 50+ per org scale.';

-- ----------------------------------------------------------------------------
-- DEPARTMENTS (linked to location)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_location_id ON public.departments(location_id);

COMMENT ON TABLE public.departments IS 'Departments per location.';

-- ----------------------------------------------------------------------------
-- TENANT MEMBERSHIPS (user ↔ org/location + enterprise role)
-- Platform roles (user, employer, admin, superadmin) stay in user_roles.
-- Enterprise roles: enterprise_owner, location_admin, recruiter.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  role enterprise_role_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enterprise owner: org-wide, location_id NULL. Location admin/recruiter: location_id set.
  CONSTRAINT tenant_membership_owner_no_location CHECK (
    (role = 'enterprise_owner' AND location_id IS NULL) OR (role != 'enterprise_owner')
  ),
  UNIQUE(user_id, organization_id, location_id)
);

-- One enterprise_owner per (user, org)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_memberships_one_owner_per_org
  ON public.tenant_memberships (user_id, organization_id) WHERE location_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_organization_id ON public.tenant_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_location_id ON public.tenant_memberships(location_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_role ON public.tenant_memberships(role);

COMMENT ON TABLE public.tenant_memberships IS 'Enterprise RBAC: enterprise_owner (org-wide), location_admin, recruiter (location-scoped).';

-- ----------------------------------------------------------------------------
-- USAGE TRACKING (per location; aggregate to org in app/views)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.location_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(location_id, period_date, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_location_usage_location_id ON public.location_usage(location_id);
CREATE INDEX IF NOT EXISTS idx_location_usage_period ON public.location_usage(period_date);
CREATE INDEX IF NOT EXISTS idx_location_usage_metric ON public.location_usage(metric_name);

COMMENT ON TABLE public.location_usage IS 'Usage per location; aggregate to organization for billing/reporting.';

-- ----------------------------------------------------------------------------
-- VIEW: Organization usage rollup (sum of location usage by org)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.organization_usage_rollup AS
SELECT
  l.organization_id,
  lu.period_date,
  lu.metric_name,
  SUM(lu.metric_value) AS total_value,
  COUNT(DISTINCT lu.location_id) AS location_count
FROM public.location_usage lu
JOIN public.locations l ON l.id = lu.location_id
GROUP BY l.organization_id, lu.period_date, lu.metric_name;

COMMENT ON VIEW public.organization_usage_rollup IS 'Aggregate usage per organization for billing; 1,000+ orgs scale.';

-- ----------------------------------------------------------------------------
-- ROW-LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_usage ENABLE ROW LEVEL SECURITY;

-- Helper: current user's organization IDs where they are enterprise_owner (full org access)
CREATE OR REPLACE FUNCTION public.current_user_enterprise_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.tenant_memberships
  WHERE user_id = auth.uid() AND role = 'enterprise_owner';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: current user's location IDs (as location_admin or recruiter)
CREATE OR REPLACE FUNCTION public.current_user_location_ids()
RETURNS SETOF UUID AS $$
  SELECT location_id FROM public.tenant_memberships
  WHERE user_id = auth.uid() AND location_id IS NOT NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organizations: Enterprise owners see their orgs; superadmin sees all
DROP POLICY IF EXISTS "Enterprise owners see own orgs" ON public.organizations;
CREATE POLICY "Enterprise owners see own orgs"
  ON public.organizations FOR SELECT
  USING (
    id IN (SELECT public.current_user_enterprise_org_ids())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Enterprise owners manage own orgs" ON public.organizations;
CREATE POLICY "Enterprise owners manage own orgs"
  ON public.organizations FOR ALL
  USING (id IN (SELECT public.current_user_enterprise_org_ids()))
  WITH CHECK (id IN (SELECT public.current_user_enterprise_org_ids()));

DROP POLICY IF EXISTS "Superadmin full access organizations" ON public.organizations;
CREATE POLICY "Superadmin full access organizations"
  ON public.organizations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

-- Locations: Enterprise owner sees all under their org; Location admin sees only their location_id
DROP POLICY IF EXISTS "Enterprise owners see org locations" ON public.locations;
CREATE POLICY "Enterprise owners see org locations"
  ON public.locations FOR SELECT
  USING (
    organization_id IN (SELECT public.current_user_enterprise_org_ids())
    OR id IN (SELECT public.current_user_location_ids())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Enterprise owners manage org locations" ON public.locations;
CREATE POLICY "Enterprise owners manage org locations"
  ON public.locations FOR ALL
  USING (organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.current_user_enterprise_org_ids()));

DROP POLICY IF EXISTS "Location admins manage own location" ON public.locations;
CREATE POLICY "Location admins manage own location"
  ON public.locations FOR SELECT
  USING (id IN (SELECT public.current_user_location_ids()));

DROP POLICY IF EXISTS "Superadmin full access locations" ON public.locations;
CREATE POLICY "Superadmin full access locations"
  ON public.locations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

-- Departments: visible/editable by enterprise owner (via location's org) or location admin (via location_id)
DROP POLICY IF EXISTS "Enterprise and location admins see departments" ON public.departments;
CREATE POLICY "Enterprise and location admins see departments"
  ON public.departments FOR SELECT
  USING (
    location_id IN (
      SELECT l.id FROM public.locations l
      WHERE l.organization_id IN (SELECT public.current_user_enterprise_org_ids())
      UNION
      SELECT id FROM public.locations WHERE id IN (SELECT public.current_user_location_ids())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Enterprise owners manage org departments" ON public.departments;
CREATE POLICY "Enterprise owners manage org departments"
  ON public.departments FOR ALL
  USING (
    location_id IN (SELECT l.id FROM public.locations l WHERE l.organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  )
  WITH CHECK (
    location_id IN (SELECT l.id FROM public.locations l WHERE l.organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  );

DROP POLICY IF EXISTS "Location admins manage own location departments" ON public.departments;
CREATE POLICY "Location admins manage own location departments"
  ON public.departments FOR ALL
  USING (location_id IN (SELECT public.current_user_location_ids()))
  WITH CHECK (location_id IN (SELECT public.current_user_location_ids()));

-- Tenant memberships: users see own; enterprise owners see org memberships; superadmin sees all
DROP POLICY IF EXISTS "Users see own tenant memberships" ON public.tenant_memberships;
CREATE POLICY "Users see own tenant memberships"
  ON public.tenant_memberships FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Enterprise owners see org tenant memberships" ON public.tenant_memberships;
CREATE POLICY "Enterprise owners see org tenant memberships"
  ON public.tenant_memberships FOR SELECT
  USING (organization_id IN (SELECT public.current_user_enterprise_org_ids()));

DROP POLICY IF EXISTS "Enterprise owners manage org tenant memberships" ON public.tenant_memberships;
CREATE POLICY "Enterprise owners manage org tenant memberships"
  ON public.tenant_memberships FOR ALL
  USING (organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.current_user_enterprise_org_ids()));

DROP POLICY IF EXISTS "Superadmin full access tenant_memberships" ON public.tenant_memberships;
CREATE POLICY "Superadmin full access tenant_memberships"
  ON public.tenant_memberships FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

-- Location usage: enterprise owner sees org's locations; location admin sees own location
DROP POLICY IF EXISTS "Enterprise and location admins see location_usage" ON public.location_usage;
CREATE POLICY "Enterprise and location admins see location_usage"
  ON public.location_usage FOR SELECT
  USING (
    location_id IN (SELECT l.id FROM public.locations l WHERE l.organization_id IN (SELECT public.current_user_enterprise_org_ids()))
    OR location_id IN (SELECT public.current_user_location_ids())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
  );

-- Inserts/updates for usage typically via service role or enterprise owner
DROP POLICY IF EXISTS "Enterprise owners insert location_usage" ON public.location_usage;
CREATE POLICY "Enterprise owners insert location_usage"
  ON public.location_usage FOR INSERT
  WITH CHECK (
    location_id IN (SELECT l.id FROM public.locations l WHERE l.organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  );

DROP POLICY IF EXISTS "Superadmin full access location_usage" ON public.location_usage;
CREATE POLICY "Superadmin full access location_usage"
  ON public.location_usage FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

-- Grant usage on view (read-only)
GRANT SELECT ON public.organization_usage_rollup TO authenticated;
GRANT SELECT ON public.organization_usage_rollup TO service_role;
