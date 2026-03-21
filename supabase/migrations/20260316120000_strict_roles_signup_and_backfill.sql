-- Strict roles: employee | employer | super_admin | NULL (pending choice until /choose-role).
-- Only founder@tryworkvouch.com is super_admin at signup.

-- 1) Normalize existing data before constraint (founder first — do not demote)
UPDATE public.profiles
SET role = 'super_admin'
WHERE LOWER(TRIM(COALESCE(email, ''))) = 'founder@tryworkvouch.com';

UPDATE public.profiles
SET role = 'employee'
WHERE role IS NOT NULL
  AND LOWER(TRIM(role)) IN ('admin', 'superadmin', 'user', 'worker')
  AND LOWER(TRIM(COALESCE(email, ''))) <> 'founder@tryworkvouch.com';

UPDATE public.profiles
SET role = 'employee'
WHERE role IS NULL
  AND LOWER(TRIM(COALESCE(email, ''))) <> 'founder@tryworkvouch.com';

UPDATE public.profiles
SET role = 'super_admin'
WHERE LOWER(TRIM(COALESCE(email, ''))) = 'founder@tryworkvouch.com';

-- 2) Constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (
    role IS NULL
    OR role IN ('employee', 'employer', 'super_admin')
  );

COMMENT ON COLUMN public.profiles.role IS 'employee | employer | super_admin | NULL until first-time role choice (non-founder).';

-- 3) New signups: pending until choose-role (no DB default)
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- 4) Signup trigger: founder = super_admin; else NULL (pending)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_role text;
BEGIN
  v_profile_role := CASE
    WHEN LOWER(TRIM(COALESCE(NEW.email, ''))) = 'founder@tryworkvouch.com' THEN 'super_admin'
    ELSE NULL
  END;

  INSERT INTO public.profiles (id, full_name, email, industry, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
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
    industry = COALESCE(
      CASE
        WHEN NEW.raw_user_meta_data->>'industry' = 'law_enforcement' THEN 'law_enforcement'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'security' THEN 'security'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'hospitality' THEN 'hospitality'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'retail' THEN 'retail'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'warehousing' THEN 'warehousing'::industry_type
        ELSE NULL
      END,
      profiles.industry
    ),
    role = COALESCE(profiles.role, EXCLUDED.role);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      (SELECT role FROM public.profiles WHERE id = NEW.id),
      CASE
        WHEN NEW.raw_user_meta_data->>'user_type' = 'employer' THEN 'employer'::user_role
        ELSE 'user'::user_role
      END
    )
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
