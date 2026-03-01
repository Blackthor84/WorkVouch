-- ============================================================================
-- WORKVOUCH CREDENTIALS, EMPLOYER ENTITY RESOLUTION, RETROACTIVE VERIFICATION
-- ============================================================================
-- Part A: Candidate-facing read-only shareable credential
-- Part C: Fuzzy employer name resolution (never auto-verify)
-- Part D/E: Audit for claims and verifications; job application links credential
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) workvouch_credentials — candidate-issued, permissioned, time-stamped
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workvouch_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Snapshot of what was shared (work history summary, trust/confidence, human-factor labels)
  payload JSONB NOT NULL DEFAULT '{}',
  -- Candidate-selected visibility: 'minimal' | 'standard' | 'full'
  visibility TEXT NOT NULL DEFAULT 'standard'
    CHECK (visibility IN ('minimal', 'standard', 'full')),
  -- Share token for link-based access (unique, indexed)
  share_token TEXT UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workvouch_credentials_candidate ON public.workvouch_credentials(candidate_id);
CREATE INDEX IF NOT EXISTS idx_workvouch_credentials_share_token ON public.workvouch_credentials(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workvouch_credentials_issued ON public.workvouch_credentials(issued_at);
CREATE INDEX IF NOT EXISTS idx_workvouch_credentials_expires ON public.workvouch_credentials(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE public.workvouch_credentials IS 'Candidate-issued portable credential: read-only, permissioned, time-stamped. Employers view only.';
COMMENT ON COLUMN public.workvouch_credentials.payload IS 'Work history summary, trust/confidence outcomes, human-factor insights (no raw simulation).';
COMMENT ON COLUMN public.workvouch_credentials.share_token IS 'Token for link-based share; null if only used via job application.';

ALTER TABLE public.workvouch_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates manage own workvouch_credentials" ON public.workvouch_credentials;
CREATE POLICY "Candidates manage own workvouch_credentials"
  ON public.workvouch_credentials FOR ALL
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

-- Employers read only via share_token or via job_application (enforced in API)
DROP POLICY IF EXISTS "Service role full access workvouch_credentials" ON public.workvouch_credentials;
CREATE POLICY "Service role full access workvouch_credentials"
  ON public.workvouch_credentials FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2) job_applications: link to WorkVouch Credential (optional)
-- ----------------------------------------------------------------------------
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS workvouch_credential_id UUID REFERENCES public.workvouch_credentials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_applications_credential ON public.job_applications(workvouch_credential_id) WHERE workvouch_credential_id IS NOT NULL;

COMMENT ON COLUMN public.job_applications.workvouch_credential_id IS 'Optional: candidate applied with this WorkVouch Credential (read-only view for employer).';

-- ----------------------------------------------------------------------------
-- 3) employer_name_resolutions — fuzzy match cache (never auto-verify)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employer_name_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_name TEXT NOT NULL,
  normalized_input TEXT NOT NULL,
  employer_account_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  company_name_matched TEXT,
  confidence_score INT NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status TEXT NOT NULL DEFAULT 'unclaimed'
    CHECK (status IN ('unclaimed', 'pending_claim', 'claimed_verified')),
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_name_resolutions_input ON public.employer_name_resolutions(normalized_input);
CREATE INDEX IF NOT EXISTS idx_employer_name_resolutions_employer ON public.employer_name_resolutions(employer_account_id) WHERE employer_account_id IS NOT NULL;

COMMENT ON TABLE public.employer_name_resolutions IS 'Fuzzy employer name resolution; confidence scores; never auto-verify on name match alone.';
COMMENT ON COLUMN public.employer_name_resolutions.status IS 'unclaimed=no claim; pending_claim=claim in progress; claimed_verified=employer verified.';

ALTER TABLE public.employer_name_resolutions ENABLE ROW LEVEL SECURITY;

-- Only service_role / API uses this table (resolution is server-side)
DROP POLICY IF EXISTS "Service role employer_name_resolutions" ON public.employer_name_resolutions;
CREATE POLICY "Service role employer_name_resolutions"
  ON public.employer_name_resolutions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4) employer_claim_verification_audit — full audit trail for claims & verifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employer_claim_verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('claim_request', 'claim_approved', 'claim_rejected', 'verification_request', 'verification_consent', 'verification_completed')),
  employer_account_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_employment_record_id UUID REFERENCES public.employment_records(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_claim_verification_audit_employer ON public.employer_claim_verification_audit(employer_account_id);
CREATE INDEX IF NOT EXISTS idx_employer_claim_verification_audit_actor ON public.employer_claim_verification_audit(actor_id);
CREATE INDEX IF NOT EXISTS idx_employer_claim_verification_audit_created ON public.employer_claim_verification_audit(created_at DESC);

COMMENT ON TABLE public.employer_claim_verification_audit IS 'Audit trail: employer claims and verification requests; no identity exposure without consent.';

ALTER TABLE public.employer_claim_verification_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role and admin employer_claim_verification_audit" ON public.employer_claim_verification_audit;
CREATE POLICY "Service role and admin employer_claim_verification_audit"
  ON public.employer_claim_verification_audit FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'superadmin')
    OR employer_account_id IN (SELECT id FROM public.employer_accounts WHERE user_id = auth.uid())
  );
CREATE POLICY "Service role insert employer_claim_verification_audit"
  ON public.employer_claim_verification_audit FOR INSERT TO service_role WITH CHECK (true);

-- Authenticated app can insert audit row when actor is self (for claim/verification requests)
CREATE POLICY "Authenticated insert own audit"
  ON public.employer_claim_verification_audit FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5) credential_views_audit — who viewed a credential (privacy)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credential_views_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workvouch_credential_id UUID NOT NULL REFERENCES public.workvouch_credentials(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewer_employer_id UUID REFERENCES public.employer_accounts(id) ON DELETE SET NULL,
  context TEXT NOT NULL DEFAULT 'link'
    CHECK (context IN ('link', 'job_application')),
  job_application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credential_views_audit_credential ON public.credential_views_audit(workvouch_credential_id);
CREATE INDEX IF NOT EXISTS idx_credential_views_audit_viewer ON public.credential_views_audit(viewer_id);

COMMENT ON TABLE public.credential_views_audit IS 'Audit: employer views of WorkVouch Credentials (link or job application).';

ALTER TABLE public.credential_views_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role credential_views_audit" ON public.credential_views_audit;
CREATE POLICY "Service role credential_views_audit"
  ON public.credential_views_audit FOR ALL TO service_role USING (true) WITH CHECK (true);
