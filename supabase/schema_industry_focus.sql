-- ============================================================================
-- INDUSTRY FOCUS UPDATE
-- ============================================================================
-- Add industry field and industry-specific profile fields
-- ============================================================================

-- Industry enum
CREATE TYPE industry_type AS ENUM (
  'law_enforcement',
  'security',
  'hospitality',
  'retail'
);

-- Add industry to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'industry'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN industry industry_type;
  END IF;
END $$;

-- Industry-specific fields table
CREATE TABLE IF NOT EXISTS public.industry_profile_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  industry industry_type NOT NULL,
  field_type TEXT NOT NULL, -- 'certification', 'clearance', 'skill', 'experience', etc.
  field_name TEXT NOT NULL, -- 'CPR Certified', 'Security Clearance Level', etc.
  field_value TEXT, -- The actual value/description
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON public.profiles(industry);
CREATE INDEX IF NOT EXISTS idx_industry_fields_user_id ON public.industry_profile_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_industry_fields_industry ON public.industry_profile_fields(industry);

-- Enable RLS
ALTER TABLE public.industry_profile_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own industry fields" ON public.industry_profile_fields;
CREATE POLICY "Users can view own industry fields"
  ON public.industry_profile_fields FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own industry fields" ON public.industry_profile_fields;
CREATE POLICY "Users can manage own industry fields"
  ON public.industry_profile_fields FOR ALL
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_industry_fields_updated_at
  BEFORE UPDATE ON public.industry_profile_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
