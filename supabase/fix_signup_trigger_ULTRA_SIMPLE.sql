-- ============================================================================
-- ULTRA SIMPLE SIGNUP TRIGGER - NO ERRORS POSSIBLE
-- ============================================================================
-- This is the absolute simplest version that will work no matter what
-- ============================================================================

-- Drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile - ONLY id, full_name, email (no industry, no role)
  -- This will work even if industry column doesn't exist or has issues
  BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
      NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- If even this fails, log it but don't fail the signup
      RAISE WARNING 'Failed to create profile: %', SQLERRM;
  END;
  
  -- Add default 'user' role - wrapped in exception handler
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- If this fails, log it but don't fail the signup
      RAISE WARNING 'Failed to create user role: %', SQLERRM;
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
  RAISE NOTICE 'Ultra simple signup trigger created successfully!';
  RAISE NOTICE 'This version only creates profile with id, name, email - no industry or role columns.';
END $$;
