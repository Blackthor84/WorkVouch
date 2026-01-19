-- ============================================================================
-- WORKVOUCH SCHEMA ADDITIONS FOR SUPABASE
-- ============================================================================
-- This adds WorkVouch-specific tables and fields to the existing Supabase schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Verification status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM (
      'unverified',
      'pending',
      'verified',
      'disputed'
    );
  END IF;
END $$;

-- Dispute status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
    CREATE TYPE dispute_status AS ENUM (
      'open',
      'waiting_employee',
      'awaiting_review',
      'resolved',
      'rejected'
    );
  END IF;
END $$;

-- Verification request status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_request_status') THEN
    CREATE TYPE verification_request_status AS ENUM (
      'pending',
      'approved',
      'rejected'
    );
  END IF;
END $$;

-- Plan tier enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
    CREATE TYPE plan_tier AS ENUM (
      'free',
      'basic',
      'pro'
    );
  END IF;
END $$;

-- ============================================================================
-- UPDATE JOBS TABLE
-- ============================================================================

-- Add WorkVouch-specific columns to jobs table
DO $$ 
BEGIN
  -- Add is_visible_to_employer column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'is_visible_to_employer'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN is_visible_to_employer BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add verification_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN verification_status verification_status NOT NULL DEFAULT 'unverified';
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_jobs_visible_to_employer ON public.jobs(is_visible_to_employer);
CREATE INDEX IF NOT EXISTS idx_jobs_verification_status ON public.jobs(verification_status);

-- ============================================================================
-- EMPLOYER ACCOUNTS TABLE
-- ============================================================================
-- Note: Employers are stored as profiles with role='employer', but we need
-- additional employer-specific data. We'll use a separate table for this.

CREATE TABLE IF NOT EXISTS public.employer_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  plan_tier plan_tier NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_accounts_user_id ON public.employer_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_accounts_company_name ON public.employer_accounts(LOWER(company_name));
CREATE INDEX IF NOT EXISTS idx_employer_accounts_plan_tier ON public.employer_accounts(plan_tier);

-- ============================================================================
-- VERIFICATION REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  requested_by_type TEXT NOT NULL CHECK (requested_by_type IN ('user', 'employer')),
  requested_by_id UUID NOT NULL, -- Can be user_id or employer_account_id
  status verification_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_job_id ON public.verification_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_requested_by ON public.verification_requests(requested_by_id);

-- ============================================================================
-- EMPLOYER DISPUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employer_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_account_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  dispute_reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_disputes_employer_account_id ON public.employer_disputes(employer_account_id);
CREATE INDEX IF NOT EXISTS idx_employer_disputes_job_id ON public.employer_disputes(job_id);
CREATE INDEX IF NOT EXISTS idx_employer_disputes_status ON public.employer_disputes(status);

-- ============================================================================
-- DISPUTE DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dispute_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID REFERENCES public.employer_disputes(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('pay_stub', 'w2', 'offer_letter', 'badge_photo', 'schedule')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_documents_dispute_id ON public.dispute_documents(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_documents_job_id ON public.dispute_documents(job_id);
CREATE INDEX IF NOT EXISTS idx_dispute_documents_user_id ON public.dispute_documents(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at for employer_accounts
CREATE TRIGGER update_employer_accounts_updated_at
  BEFORE UPDATE ON public.employer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for verification_requests
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at for employer_disputes
CREATE TRIGGER update_employer_disputes_updated_at
  BEFORE UPDATE ON public.employer_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.employer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_documents ENABLE ROW LEVEL SECURITY;

-- Employer accounts policies
CREATE POLICY "Users can view own employer account"
  ON public.employer_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own employer account"
  ON public.employer_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all employer accounts"
  ON public.employer_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Verification requests policies
CREATE POLICY "Users can view verification requests for their jobs"
  ON public.verification_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = verification_requests.job_id
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can view verification requests they created"
  ON public.verification_requests FOR SELECT
  USING (
    requested_by_type = 'employer' AND
    EXISTS (
      SELECT 1 FROM public.employer_accounts
      WHERE employer_accounts.id = verification_requests.requested_by_id
      AND employer_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Employer disputes policies
CREATE POLICY "Employers can view their own disputes"
  ON public.employer_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employer_accounts
      WHERE employer_accounts.id = employer_disputes.employer_account_id
      AND employer_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view disputes for their jobs"
  ON public.employer_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = employer_disputes.job_id
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all disputes"
  ON public.employer_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Dispute documents policies
CREATE POLICY "Users can view their own dispute documents"
  ON public.dispute_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all dispute documents"
  ON public.dispute_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- COMPLETE
-- ============================================================================
