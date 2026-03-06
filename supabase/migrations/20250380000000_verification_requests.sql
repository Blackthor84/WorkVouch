-- ============================================================================
-- WorkVouch Verification Request system
-- Request employment verification from a peer (by email); target may not have account.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE verification_request_status AS ENUM (
    'pending',
    'accepted',
    'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_relationship_type AS ENUM (
    'coworker',
    'manager',
    'peer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_email TEXT NOT NULL,
  target_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employment_record_id UUID NOT NULL REFERENCES public.employment_records(id) ON DELETE CASCADE,
  relationship_type verification_relationship_type NOT NULL DEFAULT 'coworker',
  status verification_request_status NOT NULL DEFAULT 'pending',
  response_token TEXT UNIQUE,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verification_requests_email_lower CHECK (target_email = LOWER(TRIM(target_email)))
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_requester ON public.verification_requests(requester_profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_target_email ON public.verification_requests(LOWER(target_email));
CREATE INDEX IF NOT EXISTS idx_verification_requests_target_profile ON public.verification_requests(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_response_token ON public.verification_requests(response_token) WHERE response_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_requests_employment ON public.verification_requests(employment_record_id);

COMMENT ON TABLE public.verification_requests IS 'Requests for employment verification; target identified by email (may not have account yet).';

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Requester can see own sent requests; target can see requests to their email/profile (via API with service role or authenticated lookup)
DROP POLICY IF EXISTS "Users can view verification_requests they sent" ON public.verification_requests;
CREATE POLICY "Users can view verification_requests they sent"
  ON public.verification_requests FOR SELECT
  USING (requester_profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can view verification_requests sent to them" ON public.verification_requests;
CREATE POLICY "Users can view verification_requests sent to them"
  ON public.verification_requests FOR SELECT
  USING (target_profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can create verification_requests" ON public.verification_requests;
CREATE POLICY "Users can create verification_requests"
  ON public.verification_requests FOR INSERT
  WITH CHECK (requester_profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update verification_requests they are target of" ON public.verification_requests;
CREATE POLICY "Users can update verification_requests they are target of"
  ON public.verification_requests FOR UPDATE
  USING (target_profile_id = auth.uid())
  WITH CHECK (target_profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access verification_requests" ON public.verification_requests;
CREATE POLICY "Service role full access verification_requests"
  ON public.verification_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
