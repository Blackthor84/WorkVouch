-- ============================================================================
-- MULTI-INDUSTRY ONBOARDING SCHEMA
-- ============================================================================
-- Creates industry-specific profile tables for all industries (excluding healthcare)
-- ============================================================================

-- Law Enforcement profiles table
CREATE TABLE IF NOT EXISTS public.law_enforcement_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  work_setting TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_law_enforcement_profiles_user_id ON public.law_enforcement_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_law_enforcement_profiles_role ON public.law_enforcement_profiles(role);

-- Security profiles table
CREATE TABLE IF NOT EXISTS public.security_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  work_setting TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_profiles_user_id ON public.security_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_security_profiles_role ON public.security_profiles(role);

-- Hospitality profiles table
CREATE TABLE IF NOT EXISTS public.hospitality_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  work_setting TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitality_profiles_user_id ON public.hospitality_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_hospitality_profiles_role ON public.hospitality_profiles(role);

-- Retail profiles table
CREATE TABLE IF NOT EXISTS public.retail_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT,
  work_setting TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retail_profiles_user_id ON public.retail_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_retail_profiles_role ON public.retail_profiles(role);

-- Update triggers for all industry profiles
CREATE OR REPLACE FUNCTION update_industry_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Law Enforcement trigger
DROP TRIGGER IF EXISTS update_law_enforcement_profiles_updated_at ON public.law_enforcement_profiles;
CREATE TRIGGER update_law_enforcement_profiles_updated_at
  BEFORE UPDATE ON public.law_enforcement_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_industry_profile_updated_at();

-- Security trigger
DROP TRIGGER IF EXISTS update_security_profiles_updated_at ON public.security_profiles;
CREATE TRIGGER update_security_profiles_updated_at
  BEFORE UPDATE ON public.security_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_industry_profile_updated_at();

-- Hospitality trigger
DROP TRIGGER IF EXISTS update_hospitality_profiles_updated_at ON public.hospitality_profiles;
CREATE TRIGGER update_hospitality_profiles_updated_at
  BEFORE UPDATE ON public.hospitality_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_industry_profile_updated_at();

-- Retail trigger
DROP TRIGGER IF EXISTS update_retail_profiles_updated_at ON public.retail_profiles;
CREATE TRIGGER update_retail_profiles_updated_at
  BEFORE UPDATE ON public.retail_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_industry_profile_updated_at();

-- RLS Policies for all industry profiles
ALTER TABLE public.law_enforcement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_profiles ENABLE ROW LEVEL SECURITY;

-- Law Enforcement policies
CREATE POLICY "Users can view own law enforcement profile"
  ON public.law_enforcement_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own law enforcement profile"
  ON public.law_enforcement_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own law enforcement profile"
  ON public.law_enforcement_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Security policies
CREATE POLICY "Users can view own security profile"
  ON public.security_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own security profile"
  ON public.security_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security profile"
  ON public.security_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Hospitality policies
CREATE POLICY "Users can view own hospitality profile"
  ON public.hospitality_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own hospitality profile"
  ON public.hospitality_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hospitality profile"
  ON public.hospitality_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Retail policies
CREATE POLICY "Users can view own retail profile"
  ON public.retail_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own retail profile"
  ON public.retail_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retail profile"
  ON public.retail_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Multi-industry onboarding schema created successfully!';
  RAISE NOTICE 'Created tables for: law_enforcement, security, hospitality, retail';
END $$;
