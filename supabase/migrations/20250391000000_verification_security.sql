-- ============================================================================
-- Verification security: invite expiration and IP tracking for fraud prevention.
--
-- Why: Reduces verification fraud and abuse.
-- - expires_at: Limits invite validity to 72h so old/stolen links cannot be
--   used. Prevents replay and long-lived abuse.
-- - verification_ip: Stores client IP when a verification occurs. Enables
--   detection of same-IP bulk verifications (suspicious_ip_activity) and
--   supports fraud monitoring without exposing PII.
-- ============================================================================

-- Invite expiration: prevents use of old links; reduces risk of stolen links.
ALTER TABLE public.verification_invites
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_verification_invites_expires_at
ON public.verification_invites(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON COLUMN public.verification_invites.expires_at IS 'Invite valid until; after this time verification is rejected.';

-- IP on trust_events: for abuse detection (many verifications from one IP).
ALTER TABLE public.trust_events
ADD COLUMN IF NOT EXISTS verification_ip TEXT;

CREATE INDEX IF NOT EXISTS idx_trust_events_verification_ip
ON public.trust_events(verification_ip) WHERE verification_ip IS NOT NULL;

COMMENT ON COLUMN public.trust_events.verification_ip IS 'Client IP when verification occurred; used to detect suspicious_ip_activity.';
