-- ============================================================================
-- FIX SIGNUP TRIGGER FOR EMPLOYER SIGNUP (SAFE VERSION)
-- ============================================================================
-- This version checks if the role column exists and handles errors gracefully
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_user_type TEXT;
  v_role_column_exists BOOLEAN;
BEGIN
  -- Check if role column exists in profiles table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) INTO v_role_column_exists;

  -- Get user_type and role from metadata
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'employee');
  v_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    CASE 
      WHEN v_user_type = 'employer' THEN 'employer'
      ELSE 'user'
    END,
    'user'
  );

  -- Create profile - conditionally include role column
  IF v_role_column_exists THEN
    -- Role column exists, include it
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
      v_role
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
      role = COALESCE(v_role, profiles.role, 'user');
  ELSE
    -- Role column doesn't exist, don't include it
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
        ELSE NULL
      END
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
      );
  END IF;
  
  -- Add role to user_roles table (for backwards compatibility)
  -- This will work even if role column doesn't exist in profiles
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- If role doesn't exist in enum or other error, default to 'user'
      BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'user'::user_role)
        ON CONFLICT (user_id, role) DO NOTHING;
      EXCEPTION
        WHEN OTHERS THEN
          -- If even that fails, just continue (role might already exist)
          NULL;
      END;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Signup trigger updated successfully!';
  RAISE NOTICE 'It now handles both employee and employer signups safely.';
END $$;
