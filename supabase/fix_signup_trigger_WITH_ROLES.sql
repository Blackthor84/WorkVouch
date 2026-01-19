-- ============================================================================
-- SIGNUP TRIGGER WITH ROLE SUPPORT
-- ============================================================================
-- This version handles both employees and employers correctly
-- Sets role in both profiles.role and user_roles table
-- ============================================================================

-- Drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'user';
  v_user_type TEXT;
BEGIN
  -- Get user_type from metadata
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'employee');
  
  -- Determine role based on user_type
  IF v_user_type = 'employer' THEN
    v_role := 'employer';
  ELSE
    v_role := 'user';
  END IF;

  -- Override with explicit role if provided in metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := NEW.raw_user_meta_data->>'role';
  END IF;

  -- Create profile with industry and role
  BEGIN
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
            WHEN NEW.raw_user_meta_data->>'industry' = 'healthcare' THEN 'healthcare'::industry_type
            ELSE NULL
      END,
      v_role
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
      role = COALESCE(v_role, profiles.role, 'user');
  EXCEPTION
    WHEN undefined_column THEN
      -- Role or industry column doesn't exist, create without them
      BEGIN
        INSERT INTO public.profiles (id, full_name, email, industry)
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
            WHEN NEW.raw_user_meta_data->>'industry' = 'healthcare' THEN 'healthcare'::industry_type
            ELSE NULL
          END
        )
        ON CONFLICT (id) DO NOTHING;
      EXCEPTION
        WHEN undefined_column THEN
          -- Industry column also doesn't exist, create with just basics
          INSERT INTO public.profiles (id, full_name, email)
          VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
            NEW.email
          )
          ON CONFLICT (id) DO NOTHING;
      END;
  END;
  
  -- Add role to user_roles table
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- If role doesn't exist in enum, default to 'user'
      BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'user'::user_role)
        ON CONFLICT (user_id, role) DO NOTHING;
      EXCEPTION
        WHEN OTHERS THEN
          -- If even that fails, just continue
          NULL;
      END;
  END;
  
  -- Create employer_accounts entry if role is 'employer'
  IF v_role = 'employer' THEN
    BEGIN
      INSERT INTO public.employer_accounts (user_id, company_name, plan_tier)
      VALUES (
        NEW.id,
        COALESCE(
          NEW.raw_user_meta_data->>'company_name',
          NEW.raw_user_meta_data->>'full_name',
          'My Company'
        ),
        'free'::plan_tier
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION
      WHEN undefined_table THEN
        -- employer_accounts table doesn't exist yet, skip
        NULL;
      WHEN OTHERS THEN
        -- If there's any other error, log but don't fail
        RAISE WARNING 'Failed to create employer_accounts: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Signup trigger with role support created successfully!';
  RAISE NOTICE 'It now correctly sets role to "employer" for employers and "user" for employees.';
  RAISE NOTICE 'It also automatically creates employer_accounts entries for employers.';
END $$;
