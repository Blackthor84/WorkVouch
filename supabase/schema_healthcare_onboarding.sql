-- ============================================================================
-- HEALTHCARE ONBOARDING SCHEMA
-- ============================================================================
-- Adds healthcare-specific tables and fields for the onboarding system
-- ============================================================================

-- Add healthcare to industry_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'industry_type'
  ) THEN
    CREATE TYPE industry_type AS ENUM (
      'law_enforcement',
      'security',
      'hospitality',
      'retail',
      'warehousing',
      'healthcare'
    );
  ELSE
    -- Add healthcare if enum exists but healthcare is not in it
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'healthcare' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'industry_type')
    ) THEN
      ALTER TYPE industry_type ADD VALUE 'healthcare';
    END IF;
  END IF;
END $$;

-- Healthcare profiles table
CREATE TABLE IF NOT EXISTS public.healthcare_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  work_setting TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_healthcare_profiles_user_id ON public.healthcare_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_profiles_role ON public.healthcare_profiles(role);

-- Coworker matches table (for all industries, not just healthcare)
CREATE TABLE IF NOT EXISTS public.coworker_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coworker_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coworker_name)
);

CREATE INDEX IF NOT EXISTS idx_coworker_matches_user_id ON public.coworker_matches(user_id);

-- Add certifications column to jobs table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'certifications'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN certifications TEXT[];
  END IF;
END $$;

-- Add work_setting column to jobs table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'work_setting'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN work_setting TEXT;
  END IF;
END $$;

-- Add industry column to jobs table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'industry'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN industry TEXT;
  END IF;
END $$;

-- Add required_certifications column to job_postings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_postings' 
    AND column_name = 'required_certifications'
  ) THEN
    ALTER TABLE public.job_postings ADD COLUMN required_certifications TEXT[];
  END IF;
END $$;

-- Add industry, work_setting, and location columns to employer_accounts if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employer_accounts' 
    AND column_name = 'industry'
  ) THEN
    ALTER TABLE public.employer_accounts ADD COLUMN industry TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employer_accounts' 
    AND column_name = 'work_setting'
  ) THEN
    ALTER TABLE public.employer_accounts ADD COLUMN work_setting TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employer_accounts' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.employer_accounts ADD COLUMN location TEXT;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_jobs_certifications ON public.jobs USING GIN(certifications);
CREATE INDEX IF NOT EXISTS idx_jobs_work_setting ON public.jobs(work_setting);
CREATE INDEX IF NOT EXISTS idx_jobs_industry ON public.jobs(industry);

-- Update trigger for healthcare_profiles updated_at
CREATE OR REPLACE FUNCTION update_healthcare_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_healthcare_profiles_updated_at ON public.healthcare_profiles;
CREATE TRIGGER update_healthcare_profiles_updated_at
  BEFORE UPDATE ON public.healthcare_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_healthcare_profiles_updated_at();

-- RLS Policies
ALTER TABLE public.healthcare_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coworker_matches ENABLE ROW LEVEL SECURITY;

-- Healthcare profiles policies
CREATE POLICY "Users can view own healthcare profile"
  ON public.healthcare_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own healthcare profile"
  ON public.healthcare_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own healthcare profile"
  ON public.healthcare_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Coworker matches policies
CREATE POLICY "Users can view own coworker matches"
  ON public.coworker_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coworker matches"
  ON public.coworker_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coworker matches"
  ON public.coworker_matches FOR DELETE
  USING (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Healthcare onboarding schema created successfully!';
END $$;
