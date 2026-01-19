-- ============================================================================
-- BASIC FIX FOR SIGNUP TRIGGER - ABSOLUTE SIMPLEST VERSION
-- ============================================================================
-- This creates a profile with NO role logic - just the basics
-- Run this to get signup working, then we can add role logic later
-- ============================================================================

-- Drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile - ONLY basic fields, no role
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
  ON CONFLICT (id) DO NOTHING;
  
  -- Add default 'user' role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
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
  RAISE NOTICE 'Basic signup trigger created successfully!';
  RAISE NOTICE 'This is the simplest version - just creates profile and user role.';
END $$;
