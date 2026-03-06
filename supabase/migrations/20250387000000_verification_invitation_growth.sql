-- ============================================================================
-- Verification Invitation: add 'client' relationship type for growth system
-- Section 6: When invited user creates account, auto-link pending verification_requests.
-- ============================================================================

-- Add 'client' to verification_relationship_type enum (Section 1: coworkers, managers, clients)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'verification_relationship_type' AND e.enumlabel = 'client'
  ) THEN
    ALTER TYPE verification_relationship_type ADD VALUE 'client';
  END IF;
END $$;

-- Section 6: On profile insert, link pending verification_requests where target_email = new profile email
CREATE OR REPLACE FUNCTION public.link_verification_requests_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND TRIM(NEW.email) <> '' THEN
    UPDATE public.verification_requests
    SET target_profile_id = NEW.id
    WHERE LOWER(TRIM(target_email)) = LOWER(TRIM(NEW.email))
      AND status = 'pending'
      AND target_profile_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_verification_requests_on_profile_insert_trigger ON public.profiles;
CREATE TRIGGER link_verification_requests_on_profile_insert_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_verification_requests_on_profile_insert();
