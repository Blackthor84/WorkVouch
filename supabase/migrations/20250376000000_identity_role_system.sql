-- ============================================================================
-- IDENTITY & ROLE ARCHITECTURE (Additive)
-- Keeps auth.users as source of auth; profiles as identity root (id, email, full_name, role, created_at).
-- Adds: employee_profiles, employer_profiles, organization_members, trust_events.
-- Existing tables already use profiles.id as identity root:
--   trust_scores.user_id -> profiles(id), workvouch_credentials.candidate_id -> profiles(id).
-- Backward compatible: no columns dropped from profiles.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) employee_profiles — one row per employee identity (profile_id = profiles.id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Role-specific fields (migrated from profiles over time; optional here for new signups)
  professional_summary TEXT,
  visibility profile_visibility NOT NULL DEFAULT 'public',
  profile_photo_url TEXT,
  industry TEXT,
  vertical TEXT,
  vertical_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_profiles_profile_id ON public.employee_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_industry ON public.employee_profiles(industry) WHERE industry IS NOT NULL;

COMMENT ON TABLE public.employee_profiles IS 'Employee (worker) identity extension. Root identity: profiles.id.';

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own employee_profile" ON public.employee_profiles;
CREATE POLICY "Users can view own employee_profile"
  ON public.employee_profiles FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own employee_profile" ON public.employee_profiles;
CREATE POLICY "Users can update own employee_profile"
  ON public.employee_profiles FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own employee_profile" ON public.employee_profiles;
CREATE POLICY "Users can insert own employee_profile"
  ON public.employee_profiles FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Employers and admins may need to read employee_profiles for candidate views (enforced in API)
DROP POLICY IF EXISTS "Service role full access employee_profiles" ON public.employee_profiles;
CREATE POLICY "Service role full access employee_profiles"
  ON public.employee_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2) employer_profiles — one row per employer identity (profile_id = profiles.id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_employer_account_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employer_profiles_profile_id ON public.employer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_default_account ON public.employer_profiles(default_employer_account_id) WHERE default_employer_account_id IS NOT NULL;

COMMENT ON TABLE public.employer_profiles IS 'Employer identity extension. Root identity: profiles.id. Links to employer_accounts.';

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own employer_profile" ON public.employer_profiles;
CREATE POLICY "Users can view own employer_profile"
  ON public.employer_profiles FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own employer_profile" ON public.employer_profiles;
CREATE POLICY "Users can update own employer_profile"
  ON public.employer_profiles FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own employer_profile" ON public.employer_profiles;
CREATE POLICY "Users can insert own employer_profile"
  ON public.employer_profiles FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access employer_profiles" ON public.employer_profiles;
CREATE POLICY "Service role full access employer_profiles"
  ON public.employer_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3) organization_members — profile ↔ organization (identity root: profiles.id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_profile_id ON public.organization_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members(role);

COMMENT ON TABLE public.organization_members IS 'Profile membership in organizations. Identity root: profiles.id.';

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own org memberships" ON public.organization_members;
CREATE POLICY "Members can view own org memberships"
  ON public.organization_members FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access organization_members" ON public.organization_members;
CREATE POLICY "Service role full access organization_members"
  ON public.organization_members FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4) trust_events — audit trail for trust-related events (identity root: profiles.id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trust_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_events_profile_id ON public.trust_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_trust_events_event_type ON public.trust_events(event_type);
CREATE INDEX IF NOT EXISTS idx_trust_events_created_at ON public.trust_events(created_at DESC);

COMMENT ON TABLE public.trust_events IS 'Trust system event log per identity. Root: profiles.id.';

ALTER TABLE public.trust_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trust_events" ON public.trust_events;
CREATE POLICY "Users can view own trust_events"
  ON public.trust_events FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access trust_events" ON public.trust_events;
CREATE POLICY "Service role full access trust_events"
  ON public.trust_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5) Ensure profiles has identity columns (add if missing; no drops)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6) Backfill employee_profiles from profiles (role = 'user' or role is null)
-- ----------------------------------------------------------------------------
INSERT INTO public.employee_profiles (profile_id, professional_summary, visibility, profile_photo_url, industry, vertical, vertical_metadata, created_at, updated_at)
SELECT
  p.id,
  p.professional_summary,
  CASE WHEN p.visibility::text IN ('public', 'private') THEN (p.visibility::text)::profile_visibility ELSE 'public'::profile_visibility END,
  p.profile_photo_url,
  p.industry,
  p.vertical,
  p.vertical_metadata,
  COALESCE(p.created_at, NOW()),
  COALESCE(p.updated_at, NOW())
FROM public.profiles p
WHERE (p.role IS NULL OR p.role = 'user')
  AND NOT EXISTS (SELECT 1 FROM public.employee_profiles ep WHERE ep.profile_id = p.id);

-- ----------------------------------------------------------------------------
-- 7) Backfill employer_profiles from profiles (role = 'employer') + employer_accounts
-- ----------------------------------------------------------------------------
INSERT INTO public.employer_profiles (profile_id, default_employer_account_id, created_at, updated_at)
SELECT
  p.id,
  (SELECT ea.id FROM public.employer_accounts ea WHERE ea.user_id = p.id ORDER BY ea.created_at LIMIT 1),
  COALESCE(p.created_at, NOW()),
  COALESCE(p.updated_at, NOW())
FROM public.profiles p
WHERE p.role = 'employer'
  AND NOT EXISTS (SELECT 1 FROM public.employer_profiles ep WHERE ep.profile_id = p.id);

-- ----------------------------------------------------------------------------
-- 8) Backfill organization_members from tenant_memberships (one row per profile-org)
-- ----------------------------------------------------------------------------
INSERT INTO public.organization_members (profile_id, organization_id, role, created_at, updated_at)
SELECT DISTINCT ON (tm.user_id, tm.organization_id)
  tm.user_id,
  tm.organization_id,
  tm.role::TEXT,
  tm.created_at,
  tm.updated_at
FROM public.tenant_memberships tm
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_members om
  WHERE om.profile_id = tm.user_id AND om.organization_id = tm.organization_id
)
ORDER BY tm.user_id, tm.organization_id, tm.created_at DESC;

-- ----------------------------------------------------------------------------
-- 9) Trigger: after insert on profiles, create employee_profiles or employer_profiles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_to_role_tables()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'employer' THEN
    INSERT INTO public.employer_profiles (profile_id, created_at, updated_at)
    VALUES (NEW.id, COALESCE(NEW.created_at, NOW()), NOW())
    ON CONFLICT (profile_id) DO NOTHING;
  ELSE
    -- default: employee (user)
    INSERT INTO public.employee_profiles (profile_id, created_at, updated_at)
    VALUES (NEW.id, COALESCE(NEW.created_at, NOW()), NOW())
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_to_role_tables_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_role_tables_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_role_tables();

-- ----------------------------------------------------------------------------
-- 10) Compatibility view: profile identity + employee/employer (for dashboards)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.profiles_with_role_tables AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  ep.id AS employee_profile_id,
  ep.professional_summary,
  ep.visibility AS employee_visibility,
  ep.profile_photo_url,
  ep.industry,
  ep.vertical,
  epr.id AS employer_profile_id,
  epr.default_employer_account_id
FROM public.profiles p
LEFT JOIN public.employee_profiles ep ON ep.profile_id = p.id
LEFT JOIN public.employer_profiles epr ON epr.profile_id = p.id;

COMMENT ON VIEW public.profiles_with_role_tables IS 'Backward-compatibility: identity (profiles) joined to employee_profiles and employer_profiles.';
