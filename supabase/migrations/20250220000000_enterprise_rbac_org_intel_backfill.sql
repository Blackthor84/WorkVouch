-- ============================================================================
-- ENTERPRISE RBAC, ORG INTELLIGENCE, EMPLOYER→ORG/LOCATION BACKFILL
-- Additive only. No destructive changes. Wrapped in transaction.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) ORGANIZATIONS: enterprise_plan, billing_contact_email
-- ----------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS enterprise_plan TEXT,
  ADD COLUMN IF NOT EXISTS billing_contact_email TEXT;

COMMENT ON COLUMN public.organizations.enterprise_plan IS 'enterprise_basic, enterprise_plus, enterprise_security; bypasses per-location subscription limit.';
COMMENT ON COLUMN public.organizations.billing_contact_email IS 'Billing contact for enterprise.';

-- ----------------------------------------------------------------------------
-- 2) LOCATIONS: address, status
-- ----------------------------------------------------------------------------
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

COMMENT ON COLUMN public.locations.address IS 'Full address.';
COMMENT ON COLUMN public.locations.status IS 'active, inactive, etc.';

-- ----------------------------------------------------------------------------
-- 3) EMPLOYER_USERS (RBAC: org_admin, location_admin, hiring_manager)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE employer_user_role_enum AS ENUM (
    'org_admin',
    'location_admin',
    'hiring_manager'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.employer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role employer_user_role_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, organization_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_employer_users_organization_id ON public.employer_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_employer_users_location_id ON public.employer_users(location_id);
CREATE INDEX IF NOT EXISTS idx_employer_users_profile_id ON public.employer_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_employer_users_role ON public.employer_users(role);

COMMENT ON TABLE public.employer_users IS 'Enterprise RBAC: org_admin, location_admin, hiring_manager. Used with platform roles for route protection.';

-- ----------------------------------------------------------------------------
-- 4) ORGANIZATION_INTELLIGENCE (org-level metrics)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  avg_hiring_confidence NUMERIC,
  fraud_density NUMERIC,
  dispute_rate NUMERIC,
  rehire_rate NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_intelligence_organization_id ON public.organization_intelligence(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_intelligence_updated_at ON public.organization_intelligence(updated_at DESC);

COMMENT ON TABLE public.organization_intelligence IS 'Org-level intelligence metrics; updated on recalc when organization_id present.';

-- ----------------------------------------------------------------------------
-- 5) INTELLIGENCE_HISTORY: organization_id (nullable)
-- ----------------------------------------------------------------------------
ALTER TABLE public.intelligence_history
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_intelligence_history_organization_id ON public.intelligence_history(organization_id);

-- ----------------------------------------------------------------------------
-- 6) EMPLOYER_ACCOUNTS: organization_id, location_id (nullable; backfill below)
-- ----------------------------------------------------------------------------
ALTER TABLE public.employer_accounts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employer_accounts_organization_id ON public.employer_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_employer_accounts_location_id ON public.employer_accounts(location_id);

-- ----------------------------------------------------------------------------
-- 7) BACKFILL: one org + one location per existing employer (no org yet)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  new_org_id UUID;
  new_loc_id UUID;
  new_slug TEXT;
BEGIN
  FOR r IN
    SELECT ea.id, ea.user_id, ea.company_name
    FROM public.employer_accounts ea
    WHERE ea.organization_id IS NULL
      AND ea.is_simulation IS NOT TRUE
  LOOP
    new_slug := lower(regexp_replace(trim(r.company_name), '\s+', '-', 'g'));
    IF length(new_slug) = 0 THEN
      new_slug := 'org-' || left(r.id::text, 8);
    END IF;
    new_slug := new_slug || '-' || left(r.id::text, 8);

    INSERT INTO public.organizations (id, name, slug, environment)
    VALUES (
      gen_random_uuid(),
      r.company_name,
      new_slug,
      'production'::app_environment_enum
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO new_org_id;

    IF new_org_id IS NULL THEN
      SELECT id INTO new_org_id FROM public.organizations WHERE slug = new_slug LIMIT 1;
    END IF;

    INSERT INTO public.locations (organization_id, name, slug, environment)
    VALUES (new_org_id, r.company_name, 'default', 'production'::app_environment_enum)
    ON CONFLICT (organization_id, slug) DO NOTHING
    RETURNING id INTO new_loc_id;

    IF new_loc_id IS NULL THEN
      SELECT id INTO new_loc_id FROM public.locations WHERE organization_id = new_org_id AND slug = 'default' LIMIT 1;
    END IF;

    UPDATE public.employer_accounts
    SET organization_id = new_org_id, location_id = new_loc_id
    WHERE id = r.id;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 8) ADMIN_AUDIT_LOGS: organization_id, ip_address
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_audit_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_organization_id ON public.admin_audit_logs(organization_id);

COMMENT ON COLUMN public.admin_audit_logs.organization_id IS 'Org context when action is org-scoped.';
COMMENT ON COLUMN public.admin_audit_logs.ip_address IS 'Client IP for audit trail.';

-- ----------------------------------------------------------------------------
-- 9) RLS for employer_users and organization_intelligence (read by org/location)
-- ----------------------------------------------------------------------------
ALTER TABLE public.employer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own employer_users" ON public.employer_users;
CREATE POLICY "Users see own employer_users"
  ON public.employer_users FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Org admins see org employer_users" ON public.employer_users;
CREATE POLICY "Org admins see org employer_users"
  ON public.employer_users FOR SELECT
  USING (
    organization_id IN (SELECT public.current_user_enterprise_org_ids())
    OR organization_id IN (SELECT organization_id FROM public.employer_users WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Superadmin employer_users" ON public.employer_users;
CREATE POLICY "Superadmin employer_users"
  ON public.employer_users FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

DROP POLICY IF EXISTS "Org sees own organization_intelligence" ON public.organization_intelligence;
CREATE POLICY "Org sees own organization_intelligence"
  ON public.organization_intelligence FOR SELECT
  USING (
    organization_id IN (SELECT public.current_user_enterprise_org_ids())
    OR organization_id IN (SELECT organization_id FROM public.employer_users WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Superadmin organization_intelligence" ON public.organization_intelligence;
CREATE POLICY "Superadmin organization_intelligence"
  ON public.organization_intelligence FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

COMMIT;
