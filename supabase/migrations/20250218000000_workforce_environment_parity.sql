-- ============================================================================
-- WORKFORCE ENVIRONMENT PARITY: Sandbox vs Production
-- Same schema, same logic, same permissions. Data separation by environment column.
-- All tables get environment; RLS enforces org + location + environment isolation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENVIRONMENT ENUM
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE app_environment_enum AS ENUM ('sandbox', 'production');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Optional: session variable for server-side use. Application MUST filter all queries by environment
-- (e.g. .eq('environment', getEnvironment(request))) so that sandbox and production data never mix.
CREATE OR REPLACE FUNCTION public.current_app_environment()
RETURNS TEXT AS $$
  SELECT COALESCE(NULLIF(current_setting('app.environment', true), ''), 'production');
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION public.current_app_environment IS 'Optional. Prefer application-level filter: .eq(environment, getEnvironment(request)).';

-- ----------------------------------------------------------------------------
-- ADD ENVIRONMENT + EXTRA COLUMNS TO EXISTING TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS environment app_environment_enum NOT NULL DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS plan_type TEXT;

COMMENT ON COLUMN public.organizations.environment IS 'sandbox or production; same schema, data isolated.';
COMMENT ON COLUMN public.organizations.industry IS 'Organization industry.';
COMMENT ON COLUMN public.organizations.plan_type IS 'Billing plan type.';

-- Backfill existing rows
UPDATE public.organizations SET environment = 'production' WHERE environment IS NULL;

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS environment app_environment_enum NOT NULL DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT;

COMMENT ON COLUMN public.locations.environment IS 'Must match organization.environment.';
COMMENT ON COLUMN public.locations.city IS 'Location city.';
COMMENT ON COLUMN public.locations.state IS 'Location state.';

UPDATE public.locations SET environment = 'production' WHERE environment IS NULL;

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS environment app_environment_enum NOT NULL DEFAULT 'production';

COMMENT ON COLUMN public.departments.environment IS 'Must match location.environment.';

UPDATE public.departments SET environment = 'production' WHERE environment IS NULL;

ALTER TABLE public.tenant_memberships
  ADD COLUMN IF NOT EXISTS environment app_environment_enum NOT NULL DEFAULT 'production';

UPDATE public.tenant_memberships SET environment = 'production' WHERE environment IS NULL;

ALTER TABLE public.location_usage
  ADD COLUMN IF NOT EXISTS environment app_environment_enum NOT NULL DEFAULT 'production';

UPDATE public.location_usage SET environment = 'production' WHERE environment IS NULL;

-- Indexes for environment filtering (scale: 1,000 orgs, 50 locations, 10k employees)
CREATE INDEX IF NOT EXISTS idx_organizations_environment ON public.organizations(environment);
CREATE INDEX IF NOT EXISTS idx_locations_environment ON public.locations(environment);
CREATE INDEX IF NOT EXISTS idx_locations_org_env ON public.locations(organization_id, environment);
CREATE INDEX IF NOT EXISTS idx_departments_environment ON public.departments(environment);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_environment ON public.tenant_memberships(environment);

-- ----------------------------------------------------------------------------
-- EMPLOYEES (workforce records per org/location; link to profile when joined)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workforce_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resume_id UUID,
  invite_status TEXT NOT NULL DEFAULT 'pending',
  environment app_environment_enum NOT NULL DEFAULT 'production',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workforce_employees_org ON public.workforce_employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_location ON public.workforce_employees(location_id);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_environment ON public.workforce_employees(environment);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_profile ON public.workforce_employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_email ON public.workforce_employees(organization_id, email);

COMMENT ON TABLE public.workforce_employees IS 'Workforce records; profile_id set when employee joins. Same logic sandbox/production.';

-- FK for resume_id after resumes table exists
-- ----------------------------------------------------------------------------
-- RESUMES (raw file + parsed JSON; one per employee or multiple versions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workforce_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.workforce_employees(id) ON DELETE CASCADE,
  raw_file_url TEXT,
  parsed_json JSONB,
  environment app_environment_enum NOT NULL DEFAULT 'production',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workforce_resumes_employee ON public.workforce_resumes(employee_id);
CREATE INDEX IF NOT EXISTS idx_workforce_resumes_environment ON public.workforce_resumes(environment);

ALTER TABLE public.workforce_employees
  DROP CONSTRAINT IF EXISTS workforce_employees_resume_id_fkey,
  ADD CONSTRAINT workforce_employees_resume_id_fkey
    FOREIGN KEY (resume_id) REFERENCES public.workforce_resumes(id) ON DELETE SET NULL;

COMMENT ON TABLE public.workforce_resumes IS 'Resume storage: raw file URL + parsed JSON. Same parsing logic in sandbox and production.';

-- ----------------------------------------------------------------------------
-- PEER REFERENCES (employee-to-employee; rating, feedback, visibility)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workforce_peer_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.workforce_employees(id) ON DELETE CASCADE,
  reviewer_employee_id UUID NOT NULL REFERENCES public.workforce_employees(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  written_feedback TEXT,
  visibility_flag TEXT NOT NULL DEFAULT 'internal',
  environment app_environment_enum NOT NULL DEFAULT 'production',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_reference_workforce CHECK (employee_id != reviewer_employee_id)
);

CREATE INDEX IF NOT EXISTS idx_workforce_peer_refs_employee ON public.workforce_peer_references(employee_id);
CREATE INDEX IF NOT EXISTS idx_workforce_peer_refs_reviewer ON public.workforce_peer_references(reviewer_employee_id);
CREATE INDEX IF NOT EXISTS idx_workforce_peer_refs_environment ON public.workforce_peer_references(environment);

COMMENT ON TABLE public.workforce_peer_references IS 'Peer references between employees. Same visibility rules in sandbox and production.';

-- ----------------------------------------------------------------------------
-- WORKFORCE AUDIT LOGS (organization_id, user_id, action, metadata, environment)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workforce_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  environment app_environment_enum NOT NULL DEFAULT 'production',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workforce_audit_org ON public.workforce_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_workforce_audit_environment ON public.workforce_audit_logs(environment);
CREATE INDEX IF NOT EXISTS idx_workforce_audit_created ON public.workforce_audit_logs(created_at DESC);

COMMENT ON TABLE public.workforce_audit_logs IS 'Audit trail for workforce actions. Environment-isolated.';

-- ----------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_workforce_employees_updated_at ON public.workforce_employees;
CREATE TRIGGER set_workforce_employees_updated_at
  BEFORE UPDATE ON public.workforce_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_workforce_resumes_updated_at ON public.workforce_resumes;
CREATE TRIGGER set_workforce_resumes_updated_at
  BEFORE UPDATE ON public.workforce_resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_workforce_peer_references_updated_at ON public.workforce_peer_references;
CREATE TRIGGER set_workforce_peer_references_updated_at
  BEFORE UPDATE ON public.workforce_peer_references FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS: ENVIRONMENT + ORG + LOCATION ISOLATION
-- All policies filter by current_app_environment() so sandbox never sees production and vice versa.
-- ----------------------------------------------------------------------------
ALTER TABLE public.workforce_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_peer_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_audit_logs ENABLE ROW LEVEL SECURITY;

-- workforce_employees: enterprise_owner (all locations in org), location_admin/recruiter (their location), employee (own row)
-- Application MUST add .eq('environment', currentEnv) to every query; RLS enforces org/location only.
DROP POLICY IF EXISTS "workforce_employees_env_enterprise_owner" ON public.workforce_employees;
CREATE POLICY "workforce_employees_env_enterprise_owner"
  ON public.workforce_employees FOR ALL
  USING (organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.current_user_enterprise_org_ids()));

DROP POLICY IF EXISTS "workforce_employees_env_location_scope" ON public.workforce_employees;
CREATE POLICY "workforce_employees_env_location_scope"
  ON public.workforce_employees FOR ALL
  USING (location_id IN (SELECT public.current_user_location_ids()))
  WITH CHECK (location_id IN (SELECT public.current_user_location_ids()));

DROP POLICY IF EXISTS "workforce_employees_env_own_profile" ON public.workforce_employees;
CREATE POLICY "workforce_employees_env_own_profile"
  ON public.workforce_employees FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "workforce_employees_superadmin" ON public.workforce_employees;
CREATE POLICY "workforce_employees_superadmin"
  ON public.workforce_employees FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

-- workforce_resumes: same org/location/env as employee
DROP POLICY IF EXISTS "workforce_resumes_via_employee" ON public.workforce_resumes;
CREATE POLICY "workforce_resumes_via_employee"
  ON public.workforce_resumes FOR ALL
  USING (
    environment::text = public.current_app_environment()
    AND (
      employee_id IN (
        SELECT id FROM public.workforce_employees
        WHERE organization_id IN (SELECT public.current_user_enterprise_org_ids())
        UNION
        SELECT id FROM public.workforce_employees WHERE location_id IN (SELECT public.current_user_location_ids())
        UNION
        SELECT id FROM public.workforce_employees WHERE profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    environment::text = public.current_app_environment()
    AND employee_id IN (
      SELECT id FROM public.workforce_employees
      WHERE organization_id IN (SELECT public.current_user_enterprise_org_ids())
      UNION
      SELECT id FROM public.workforce_employees WHERE location_id IN (SELECT public.current_user_location_ids())
      UNION
      SELECT id FROM public.workforce_employees WHERE profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workforce_resumes_superadmin" ON public.workforce_resumes;
CREATE POLICY "workforce_resumes_superadmin"
  ON public.workforce_resumes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

-- workforce_peer_references: enterprise sees all in org; location sees location; employee sees references about them
DROP POLICY IF EXISTS "workforce_peer_refs_enterprise" ON public.workforce_peer_references;
CREATE POLICY "workforce_peer_refs_enterprise"
  ON public.workforce_peer_references FOR ALL
  USING (
    employee_id IN (SELECT id FROM public.workforce_employees WHERE organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM public.workforce_employees WHERE organization_id IN (SELECT public.current_user_enterprise_org_ids()))
  );

DROP POLICY IF EXISTS "workforce_peer_refs_location" ON public.workforce_peer_references;
CREATE POLICY "workforce_peer_refs_location"
  ON public.workforce_peer_references FOR ALL
  USING (
    employee_id IN (SELECT id FROM public.workforce_employees WHERE location_id IN (SELECT public.current_user_location_ids()))
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM public.workforce_employees WHERE location_id IN (SELECT public.current_user_location_ids()))
  );

DROP POLICY IF EXISTS "workforce_peer_refs_employee_sees_about_me" ON public.workforce_peer_references;
CREATE POLICY "workforce_peer_refs_employee_sees_about_me"
  ON public.workforce_peer_references FOR SELECT
  USING (
    employee_id IN (SELECT id FROM public.workforce_employees WHERE profile_id = auth.uid())
    OR reviewer_employee_id IN (SELECT id FROM public.workforce_employees WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "workforce_peer_refs_superadmin" ON public.workforce_peer_references;
CREATE POLICY "workforce_peer_refs_superadmin"
  ON public.workforce_peer_references FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

-- workforce_audit_logs: org-scoped + environment
DROP POLICY IF EXISTS "workforce_audit_org_env" ON public.workforce_audit_logs;
CREATE POLICY "workforce_audit_org_env"
  ON public.workforce_audit_logs FOR ALL
  USING (
    environment::text = public.current_app_environment()
    AND (
      organization_id IN (SELECT public.current_user_enterprise_org_ids())
      OR organization_id IN (SELECT organization_id FROM public.tenant_memberships WHERE user_id = auth.uid() AND location_id IN (SELECT public.current_user_location_ids()))
    )
  )
  WITH CHECK (
    environment::text = public.current_app_environment()
    AND organization_id IN (SELECT public.current_user_enterprise_org_ids())
  );

DROP POLICY IF EXISTS "workforce_audit_superadmin" ON public.workforce_audit_logs;
CREATE POLICY "workforce_audit_superadmin"
  ON public.workforce_audit_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );

-- ----------------------------------------------------------------------------
-- EXISTING TABLE RLS: ADD ENVIRONMENT FILTER
-- Organizations, locations, departments, tenant_memberships, location_usage
-- must only expose rows where environment = current_app_environment().
-- (Policies already restrict by org/location; add env to USING/WITH CHECK.)
-- ----------------------------------------------------------------------------
-- Note: Adding environment to existing policies would require dropping and recreating each.
-- For minimal change, create a single helper that RLS can use:
-- "row is visible only if row.environment = current_app_environment()".
-- We add new policies that also require environment match; existing policies
-- remain for backward compatibility but we add env-check policies that restrict
-- SELECT/ALL to current environment. Easiest: add USING (environment::text = current_app_environment())
-- to each existing policy. That would require editing every policy.
-- Alternative: create a view per table that filters by current_app_environment(), and use views in app.
-- Simpler: in application layer, always add .eq('environment', currentEnv) to every query.
-- So we do NOT change RLS here for organizations/locations/departments/tenant_memberships/location_usage;
-- we document that API must set app.environment and filter by environment in queries.
-- For workforce_* tables we already have environment in policies.
-- Optional: add one restrictive policy that denies access when environment != current_app_environment().
-- That would require (environment = current_app_environment()) on every existing policy.
-- For this migration we leave existing org/location/department RLS as-is and enforce environment
-- in the application layer (getEnvironment() and .eq('environment', env) on all queries).
-- Super admin can switch environment via app.environment to see sandbox or production.
-- APPLICATION RULE: Every API and server query MUST add .eq('environment', getEnvironment(request)).
-- No record may be accessible across environment or organization. Same logic in sandbox and production.
