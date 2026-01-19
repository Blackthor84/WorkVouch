-- ============================================================================
-- PEERCV DATABASE SCHEMA
-- ============================================================================
-- This schema defines the complete database structure for PeerCV.
-- Designed for future extensibility and fraud detection.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Employment type enum
CREATE TYPE employment_type AS ENUM (
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary',
  'freelance'
);

-- User role enum
CREATE TYPE user_role AS ENUM (
  'user',
  'employer',
  'admin'
);

-- Relationship type for references
CREATE TYPE relationship_type AS ENUM (
  'coworker',
  'supervisor',
  'subordinate',
  'peer',
  'client',
  'vendor'
);

-- Profile visibility
CREATE TYPE profile_visibility AS ENUM (
  'public',
  'private'
);

-- Connection status
CREATE TYPE connection_status AS ENUM (
  'pending',
  'confirmed',
  'rejected'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
-- Note: Supabase Auth handles email/password, we store additional profile data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  city TEXT,
  state TEXT,
  profile_photo_url TEXT,
  professional_summary TEXT,
  visibility profile_visibility NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles junction table (users can have multiple roles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Job history table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  employment_type employment_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  supervisor_name TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure end_date is after start_date if both exist
  CONSTRAINT valid_date_range CHECK (
    end_date IS NULL OR end_date >= start_date
  ),
  -- Ensure is_current is true if end_date is null
  CONSTRAINT current_job_consistency CHECK (
    (is_current = true AND end_date IS NULL) OR
    (is_current = false AND end_date IS NOT NULL)
  )
);

-- Coworker connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  status connection_status NOT NULL DEFAULT 'pending',
  initiated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent self-connections
  CONSTRAINT no_self_connection CHECK (user_id != connected_user_id)
);

-- Peer references table
CREATE TABLE public.references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  written_feedback TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false, -- Soft delete for admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent self-references
  CONSTRAINT no_self_reference CHECK (from_user_id != to_user_id),
  -- Ensure one reference per user pair per job
  CONSTRAINT unique_reference UNIQUE (from_user_id, to_user_id, job_id)
);

-- Trust scores table (v1 - replaceable)
CREATE TABLE public.trust_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (score >= 0 AND score <= 100),
  job_count INTEGER NOT NULL DEFAULT 0,
  reference_count INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version TEXT NOT NULL DEFAULT 'v1' -- Track calculation version
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_visibility ON public.profiles(visibility);
CREATE INDEX idx_profiles_city_state ON public.profiles(city, state);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Jobs indexes (critical for matching logic)
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_company_name ON public.jobs(LOWER(company_name));
CREATE INDEX idx_jobs_dates ON public.jobs(start_date, end_date);
CREATE INDEX idx_jobs_private ON public.jobs(is_private);
CREATE INDEX idx_jobs_user_company ON public.jobs(user_id, LOWER(company_name));

-- Connections indexes
CREATE INDEX idx_connections_user_id ON public.connections(user_id);
CREATE INDEX idx_connections_connected_user_id ON public.connections(connected_user_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_connections_job_id ON public.connections(job_id);
-- Unique index to ensure bidirectional connection uniqueness
CREATE UNIQUE INDEX idx_connections_unique_pair ON public.connections(
  LEAST(user_id, connected_user_id),
  GREATEST(user_id, connected_user_id)
);

-- References indexes
CREATE INDEX idx_references_from_user ON public.references(from_user_id);
CREATE INDEX idx_references_to_user ON public.references(to_user_id);
CREATE INDEX idx_references_job_id ON public.references(job_id);
CREATE INDEX idx_references_deleted ON public.references(is_deleted);

-- Trust scores indexes
CREATE INDEX idx_trust_scores_user_id ON public.trust_scores(user_id);
CREATE INDEX idx_trust_scores_score ON public.trust_scores(score DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile and add user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with industry from metadata
  INSERT INTO public.profiles (id, full_name, email, industry)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'industry' = 'law_enforcement' THEN 'law_enforcement'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'security' THEN 'security'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'hospitality' THEN 'hospitality'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'retail' THEN 'retail'::industry_type
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    industry = COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data->>'industry' = 'law_enforcement' THEN 'law_enforcement'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'security' THEN 'security'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'hospitality' THEN 'hospitality'::industry_type
        WHEN NEW.raw_user_meta_data->>'industry' = 'retail' THEN 'retail'::industry_type
        ELSE NULL
      END,
      profiles.industry
    );
  
  -- Add default 'user' role (using SECURITY DEFINER to bypass RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate trust score (v1 logic)
-- This is designed to be replaceable in future versions
CREATE OR REPLACE FUNCTION calculate_trust_score_v1(p_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_job_count INTEGER;
  v_reference_count INTEGER;
  v_avg_rating DECIMAL(3,2);
  v_score DECIMAL(5,2);
BEGIN
  -- Count completed jobs (non-private)
  SELECT COUNT(*) INTO v_job_count
  FROM public.jobs
  WHERE user_id = p_user_id AND is_private = false;

  -- Count references
  SELECT COUNT(*) INTO v_reference_count
  FROM public.references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  -- Calculate average rating
  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM public.references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  -- V1 Calculation: Simple weighted formula
  -- Job count: 30% weight (max 30 points)
  -- Reference count: 40% weight (max 40 points, 1 point per reference, capped at 40)
  -- Average rating: 30% weight (max 30 points, 5 stars = 30 points)
  v_score := LEAST(v_job_count * 2, 30) + 
             LEAST(v_reference_count, 40) + 
             (v_avg_rating * 6);

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to update trust score
CREATE OR REPLACE FUNCTION update_trust_score(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_score DECIMAL(5,2);
  v_job_count INTEGER;
  v_reference_count INTEGER;
  v_avg_rating DECIMAL(3,2);
BEGIN
  -- Calculate score
  v_score := calculate_trust_score_v1(p_user_id);

  -- Get counts for storage
  SELECT COUNT(*) INTO v_job_count
  FROM public.jobs
  WHERE user_id = p_user_id AND is_private = false;

  SELECT COUNT(*) INTO v_reference_count
  FROM public.references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM public.references
  WHERE to_user_id = p_user_id AND is_deleted = false;

  -- Upsert trust score
  INSERT INTO public.trust_scores (user_id, score, job_count, reference_count, average_rating, calculated_at)
  VALUES (p_user_id, v_score, v_job_count, v_reference_count, v_avg_rating, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    job_count = EXCLUDED.job_count,
    reference_count = EXCLUDED.reference_count,
    average_rating = EXCLUDED.average_rating,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate trust score when job is added/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_trust_score(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM update_trust_score(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_score_on_job_change
  AFTER INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_trust_score();

-- Trigger to recalculate trust score when reference is added/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_trust_score_on_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_trust_score(OLD.to_user_id);
    RETURN OLD;
  ELSE
    PERFORM update_trust_score(NEW.to_user_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_score_on_reference_change
  AFTER INSERT OR UPDATE OR DELETE ON public.references
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_trust_score_on_reference();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can view public profiles
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles FOR SELECT
  USING (visibility = 'public');

-- Employers can view public profiles
CREATE POLICY "Employers can view public profiles"
  ON public.profiles FOR SELECT
  USING (
    visibility = 'public' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- USER ROLES POLICIES
-- ============================================================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own role (for signup)
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- JOBS POLICIES
-- ============================================================================

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public jobs of other users
CREATE POLICY "Users can view public jobs"
  ON public.jobs FOR SELECT
  USING (is_private = false);

-- Employers can view public jobs
CREATE POLICY "Employers can view public jobs"
  ON public.jobs FOR SELECT
  USING (
    is_private = false AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs"
  ON public.jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own jobs
CREATE POLICY "Users can insert own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CONNECTIONS POLICIES
-- ============================================================================

-- Users can view connections they are part of
CREATE POLICY "Users can view own connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Users can create connections (initiate)
CREATE POLICY "Users can create connections"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = initiated_by);

-- Users can update connections they are part of (for confirming/rejecting)
CREATE POLICY "Users can update own connections"
  ON public.connections FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Admins can view all connections
CREATE POLICY "Admins can view all connections"
  ON public.connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- REFERENCES POLICIES
-- ============================================================================

-- Users can view references they gave or received
CREATE POLICY "Users can view own references"
  ON public.references FOR SELECT
  USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

-- Employers can view public references (for public jobs)
CREATE POLICY "Employers can view public references"
  ON public.references FOR SELECT
  USING (
    is_deleted = false AND
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = public.references.job_id AND jobs.is_private = false
    ) AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

-- Admins can view all references
CREATE POLICY "Admins can view all references"
  ON public.references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create references (only if they are connected)
CREATE POLICY "Users can create references"
  ON public.references FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE (
        (user_id = from_user_id AND connected_user_id = to_user_id) OR
        (user_id = to_user_id AND connected_user_id = from_user_id)
      ) AND status = 'confirmed'
    )
  );

-- References are immutable (no update policy)
-- Only admins can soft-delete
CREATE POLICY "Admins can soft-delete references"
  ON public.references FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TRUST SCORES POLICIES
-- ============================================================================

-- Users can view their own trust score
CREATE POLICY "Users can view own trust score"
  ON public.trust_scores FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view public trust scores (for public profiles)
CREATE POLICY "Anyone can view public trust scores"
  ON public.trust_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = trust_scores.user_id AND profiles.visibility = 'public'
    )
  );

-- Employers can view public trust scores
CREATE POLICY "Employers can view public trust scores"
  ON public.trust_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = trust_scores.user_id AND profiles.visibility = 'public'
    ) AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

-- Admins can view all trust scores
CREATE POLICY "Admins can view all trust scores"
  ON public.trust_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Note: First admin user should be created manually after initial setup
-- Example:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<admin-user-id>', 'admin');

