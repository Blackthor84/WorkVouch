-- Sprint 12.4: Fix production signup using ACTUAL schema (profiles.role TEXT).
--
-- Production does NOT have public.user_role enum (confirmed: Sprint 12.3 migration failed with 42704).
-- Canonical application roles live on public.profiles.role (TEXT + CHECK), not on an enum.
-- user_roles is legacy (RLS only); app routing uses profiles.role via resolveUserRole().
--
-- Safe behavior:
--   - New signup: profiles.role = NULL (pending /choose-role)
--   - Founder email: profiles.role = 'super_admin'
--   - Does NOT reference public.user_role enum
--   - Does NOT fail if user_roles table absent or incompatible

-- 1) Ensure profiles.role constraint matches app (idempotent)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (
    role IS NULL
    OR role IN ('employee', 'employer', 'super_admin')
  );

COMMENT ON COLUMN public.profiles.role IS
  'employee | employer | super_admin | NULL until /choose-role (non-founder). TEXT column — not an enum.';

-- 2) Pending role until choose-role (no default employee/user)
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- 3) Signup trigger — profiles only
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_role text;
  v_founder_email constant text := 'founder@tryworkvouch.com';
BEGIN
  v_profile_role := CASE
    WHEN lower(trim(coalesce(NEW.email, ''))) = v_founder_email THEN 'super_admin'
    ELSE NULL
  END;

  INSERT INTO public.profiles (id, full_name, email, industry, role)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE
      WHEN NEW.raw_user_meta_data->>'industry' = 'law_enforcement' THEN 'law_enforcement'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'security' THEN 'security'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'hospitality' THEN 'hospitality'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'retail' THEN 'retail'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'warehousing' THEN 'warehousing'::industry_type
      ELSE NULL
    END,
    v_profile_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    email = coalesce(excluded.email, profiles.email),
    industry = coalesce(excluded.industry, profiles.industry),
    role = coalesce(profiles.role, excluded.role);

  -- Legacy user_roles (optional): best-effort for old RLS policies; never block signup.
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'user_roles'
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (
        NEW.id,
        CASE
          WHEN v_profile_role = 'super_admin' THEN 'superadmin'
          WHEN NEW.raw_user_meta_data->>'user_type' = 'employer' THEN 'employer'
          ELSE 'user'
        END
      )
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: skipped user_roles for % (%).', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Signup: insert profiles (role NULL until choose-role). Sprint 12.4 — TEXT roles, no user_role enum.';
