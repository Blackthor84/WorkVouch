-- ============================================================================
-- EMPLOYER TOOLS SCHEMA
-- ============================================================================
-- Database schema for employer features: job postings, saved candidates, messages
-- ============================================================================

-- Job Postings Table
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  pay_range_min DECIMAL(10, 2),
  pay_range_max DECIMAL(10, 2),
  shift TEXT, -- e.g., "Full-time", "Part-time", "Night shift"
  requirements TEXT,
  industry industry_type,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_boosted BOOLEAN NOT NULL DEFAULT false,
  boost_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, rejected, accepted
  cover_letter TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_posting_id, candidate_id)
);

-- Saved Candidates Table
CREATE TABLE IF NOT EXISTS public.saved_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id)
);

-- Messages Table (for employer-candidate communication)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_employer ON public.job_postings(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_published ON public.job_postings(is_published);
CREATE INDEX IF NOT EXISTS idx_job_postings_industry ON public.job_postings(industry);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate ON public.job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_candidates_employer ON public.saved_candidates(employer_id);
CREATE INDEX IF NOT EXISTS idx_saved_candidates_candidate ON public.saved_candidates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(recipient_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Job Postings
DROP POLICY IF EXISTS "Employers can manage own job postings" ON public.job_postings;
CREATE POLICY "Employers can manage own job postings"
  ON public.job_postings FOR ALL
  USING (
    auth.uid() = employer_id AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

DROP POLICY IF EXISTS "Anyone can view published job postings" ON public.job_postings;
CREATE POLICY "Anyone can view published job postings"
  ON public.job_postings FOR SELECT
  USING (is_published = true);

-- RLS Policies for Job Applications
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Employers can view applications for their jobs"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings
      WHERE job_postings.id = job_applications.job_posting_id
      AND job_postings.employer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Candidates can create applications" ON public.job_applications;
CREATE POLICY "Candidates can create applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Candidates can view own applications" ON public.job_applications;
CREATE POLICY "Candidates can view own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = candidate_id);

-- RLS Policies for Saved Candidates
DROP POLICY IF EXISTS "Employers can manage own saved candidates" ON public.saved_candidates;
CREATE POLICY "Employers can manage own saved candidates"
  ON public.saved_candidates FOR ALL
  USING (
    auth.uid() = employer_id AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

-- RLS Policies for Messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own received messages" ON public.messages;
CREATE POLICY "Users can update own received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Update triggers
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
