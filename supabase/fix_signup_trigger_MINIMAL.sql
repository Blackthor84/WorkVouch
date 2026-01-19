-- ============================================================================
-- MINIMAL FIX FOR SIGNUP TRIGGER
-- ============================================================================
-- This is the absolute simplest version that will work
-- It doesn't use the role column at all - just creates profile and user_roles
-- ============================================================================

-- Drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'user';
  v_user_type TEXT;
BEGIN
  -- Create profile WITHOUT role column (safest)
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
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    email = COALESCE(NEW.email, profiles.email);
  
  -- Determine role from user_type
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'employee');
  
  IF v_user_type = 'employer' THEN
    v_role := 'employer';
  END IF;
  
  -- Add role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- If role column exists, update it
  BEGIN
    EXECUTE format('UPDATE public.profiles SET role = $1 WHERE id = $2')
    USING v_role::TEXT, NEW.id;
  EXCEPTION
    WHEN undefined_column THEN
      -- Role column doesn't exist, that's fine
      NULL;
  END;
  
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
  RAISE NOTICE 'Minimal signup trigger created successfully!';
END $$;
