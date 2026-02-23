-- CNA credentials: all fields optional. CNAs can complete onboarding via peer/employer verification.
CREATE TABLE IF NOT EXISTS public.cna_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  state TEXT,
  registry_number TEXT,
  expiration_date DATE,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_cna_credentials_user_id ON public.cna_credentials(user_id);

ALTER TABLE public.cna_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_cna_credentials_own" ON public.cna_credentials;
CREATE POLICY "user_cna_credentials_own"
  ON public.cna_credentials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.cna_credentials IS 'Optional CNA certification. Peer or employer verification can be used instead.';

-- CNA work history: add employment types for per-diem and agency
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'per_diem' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'employment_type')) THEN
    ALTER TYPE employment_type ADD VALUE 'per_diem';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'staffing_agency' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'employment_type')) THEN
    ALTER TYPE employment_type ADD VALUE 'staffing_agency';
  END IF;
END $$;
