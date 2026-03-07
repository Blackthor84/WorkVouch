-- ============================================================================
-- Claim Your WorkVouch Profile: verifier_email and profile_claimed on verification_invites.
-- Enables post-verification signup flow and trust event verifier_joined_network.
-- ============================================================================

-- Verifier email: explicit column for the invitee (coworker) who can claim a profile.
ALTER TABLE public.verification_invites
ADD COLUMN IF NOT EXISTS verifier_email TEXT;

-- Backfill from existing email (invitee = verifier).
UPDATE public.verification_invites
SET verifier_email = email
WHERE verifier_email IS NULL AND email IS NOT NULL;

COMMENT ON COLUMN public.verification_invites.verifier_email IS 'Email of the verifier (invitee); used for claim-profile flow and trust event.';

-- Whether this verifier has claimed a WorkVouch profile after confirming.
ALTER TABLE public.verification_invites
ADD COLUMN IF NOT EXISTS profile_claimed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.verification_invites.profile_claimed IS 'True after the verifier signs up via the claim-profile flow (post-verification).';
