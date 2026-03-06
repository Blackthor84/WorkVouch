-- ============================================================================
-- Verification requests: SMS support (phone_number, delivery_method, email_opened)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.verification_requests ADD COLUMN phone_number TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'delivery_method'
  ) THEN
    ALTER TABLE public.verification_requests ADD COLUMN delivery_method TEXT NOT NULL DEFAULT 'email';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'email_opened'
  ) THEN
    ALTER TABLE public.verification_requests ADD COLUMN email_opened BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verification_requests' AND column_name = 'reminder_sent_at'
  ) THEN
    ALTER TABLE public.verification_requests ADD COLUMN reminder_sent_at TIMESTAMPTZ;
  END IF;
END $$;

-- Constrain delivery_method
ALTER TABLE public.verification_requests
  DROP CONSTRAINT IF EXISTS verification_requests_delivery_method_check;
ALTER TABLE public.verification_requests
  ADD CONSTRAINT verification_requests_delivery_method_check
  CHECK (delivery_method IN ('email', 'sms', 'email_and_sms'));

CREATE INDEX IF NOT EXISTS idx_verification_requests_phone ON public.verification_requests(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_requests_pending_reminder ON public.verification_requests(created_at)
  WHERE status = 'pending' AND phone_number IS NOT NULL AND phone_number != '';

COMMENT ON COLUMN public.verification_requests.phone_number IS 'E.164 phone for SMS delivery; optional.';
COMMENT ON COLUMN public.verification_requests.delivery_method IS 'email | sms | email_and_sms';
COMMENT ON COLUMN public.verification_requests.email_opened IS 'Set when invite email is opened (for reminder logic).';
