-- ============================================================================
-- SETUP JWT ROLE CLAIMS
-- ============================================================================
-- This sets up the JWT to include role from user_metadata
-- The role will be available as request.jwt.claim.role in RLS policies
-- ============================================================================

-- Create a function to sync role from profiles to auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users metadata when profile role changes
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync role to auth metadata
DROP TRIGGER IF EXISTS sync_role_to_auth_metadata_trigger ON public.profiles;
CREATE TRIGGER sync_role_to_auth_metadata_trigger
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_auth_metadata();

-- Backfill existing users' metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(COALESCE(p.role, 'user'))
)
FROM public.profiles p
WHERE auth.users.id = p.id;
