-- ============================================================================
-- FIX SIGNUP TRIGGER FOR EMPLOYER SIGNUP
-- ============================================================================
-- This fixes the handle_new_user trigger to properly handle both employees and employers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_user_type TEXT;
BEGIN
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

  -- Create profile with industry and role from metadata
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
    v_role::TEXT
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
    role = COALESCE(
      v_role,
      profiles.role,
      'user'
    );
  
  -- Add role to user_roles table (for backwards compatibility)
  -- Use the role we determined above
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
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
  RAISE NOTICE 'It now handles both employee and employer signups.';
END $$;
