-- ============================================================================
-- PEERCV VERSION 2 - DATABASE SCHEMA UPDATES
-- ============================================================================
-- This file contains all new tables and functions for Version 2 features:
-- - Notifications system
-- - Employer purchases (Stripe integration)
-- - Enhanced coworker matching
-- - Trust score nightly recalculation
-- ============================================================================

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'coworker_match', 'reference_request', 'reference_approved', 'employer_purchase'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  related_connection_id UUID REFERENCES public.connections(id) ON DELETE SET NULL,
  related_reference_id UUID REFERENCES public.references(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Employer purchases table (Stripe integration)
CREATE TABLE IF NOT EXISTS public.employer_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Optional: if reports expire after X days
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one purchase per employer-candidate pair (or allow multiple if needed)
  UNIQUE(employer_id, candidate_id)
);

-- Coworker matches table (tracks automatic matches)
CREATE TABLE IF NOT EXISTS public.coworker_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job1_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job2_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  match_confidence DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0 based on date overlap quality
  notified_user1 BOOLEAN NOT NULL DEFAULT false,
  notified_user2 BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate matches
  UNIQUE(user1_id, user2_id, job1_id, job2_id),
  -- Ensure user1_id < user2_id for consistency
  CONSTRAINT valid_user_order CHECK (user1_id < user2_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employer_purchases_employer ON public.employer_purchases(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_purchases_candidate ON public.employer_purchases(candidate_id);
CREATE INDEX IF NOT EXISTS idx_employer_purchases_status ON public.employer_purchases(status);
CREATE INDEX IF NOT EXISTS idx_employer_purchases_stripe_session ON public.employer_purchases(stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_coworker_matches_user1 ON public.coworker_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_coworker_matches_user2 ON public.coworker_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_coworker_matches_notified ON public.coworker_matches(notified_user1, notified_user2);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to detect and create coworker matches when a job is added
CREATE OR REPLACE FUNCTION detect_coworker_matches(p_job_id UUID)
RETURNS VOID AS $$
DECLARE
  v_job RECORD;
  v_matching_jobs RECORD;
  v_user1_id UUID;
  v_user2_id UUID;
  v_match_confidence DECIMAL(3,2);
BEGIN
  -- Get the new job details
  SELECT * INTO v_job
  FROM public.jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Find jobs at the same company with overlapping dates
  FOR v_matching_jobs IN
    SELECT j.*
    FROM public.jobs j
    WHERE j.id != p_job_id
      AND j.user_id != v_job.user_id
      AND j.is_private = false
      AND LOWER(TRIM(j.company_name)) = LOWER(TRIM(v_job.company_name))
      AND (
        -- Date overlap: (start1 <= end2) AND (end1 >= start2)
        (v_job.start_date <= COALESCE(j.end_date, '9999-12-31'::DATE))
        AND (COALESCE(v_job.end_date, '9999-12-31'::DATE) >= j.start_date)
      )
  LOOP
    -- Determine user order (user1_id < user2_id)
    IF v_job.user_id < v_matching_jobs.user_id THEN
      v_user1_id := v_job.user_id;
      v_user2_id := v_matching_jobs.user_id;
    ELSE
      v_user1_id := v_matching_jobs.user_id;
      v_user2_id := v_job.user_id;
    END IF;

    -- Calculate match confidence based on date overlap
    -- More overlap = higher confidence
    v_match_confidence := calculate_date_overlap_confidence(
      v_job.start_date,
      COALESCE(v_job.end_date, CURRENT_DATE),
      v_matching_jobs.start_date,
      COALESCE(v_matching_jobs.end_date, CURRENT_DATE)
    );

    -- Insert match (ignore if already exists)
    INSERT INTO public.coworker_matches (
      user1_id, user2_id, job1_id, job2_id, company_name, match_confidence
    )
    VALUES (
      v_user1_id,
      v_user2_id,
      CASE WHEN v_job.user_id = v_user1_id THEN v_job.id ELSE v_matching_jobs.id END,
      CASE WHEN v_job.user_id = v_user1_id THEN v_matching_jobs.id ELSE v_job.id END,
      v_job.company_name,
      v_match_confidence
    )
    ON CONFLICT (user1_id, user2_id, job1_id, job2_id) DO NOTHING;

    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, related_user_id, related_job_id)
    VALUES
      (
        v_user1_id,
        'coworker_match',
        'Potential Coworker Found',
        'You may know ' || (SELECT full_name FROM public.profiles WHERE id = v_user2_id) || 
        ' from ' || v_job.company_name || '. Leave a reference?',
        v_user2_id,
        CASE WHEN v_job.user_id = v_user1_id THEN v_job.id ELSE v_matching_jobs.id END
      ),
      (
        v_user2_id,
        'coworker_match',
        'Potential Coworker Found',
        'You may know ' || (SELECT full_name FROM public.profiles WHERE id = v_user1_id) || 
        ' from ' || v_job.company_name || '. Leave a reference?',
        v_user1_id,
        CASE WHEN v_job.user_id = v_user1_id THEN v_matching_jobs.id ELSE v_job.id END
      )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Helper function to calculate date overlap confidence
CREATE OR REPLACE FUNCTION calculate_date_overlap_confidence(
  start1 DATE, end1 DATE, start2 DATE, end2 DATE
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_overlap_start DATE;
  v_overlap_end DATE;
  v_overlap_days INTEGER;
  v_total_days INTEGER;
  v_confidence DECIMAL(3,2);
BEGIN
  -- Calculate overlap period
  v_overlap_start := GREATEST(start1, start2);
  v_overlap_end := LEAST(end1, end2);
  
  IF v_overlap_end < v_overlap_start THEN
    RETURN 0.0;
  END IF;

  v_overlap_days := v_overlap_end - v_overlap_start + 1;
  v_total_days := GREATEST(end1 - start1 + 1, end2 - start2 + 1);
  
  -- Confidence is the ratio of overlap to total period
  -- Minimum 0.1 if there's any overlap, up to 1.0 for perfect overlap
  v_confidence := GREATEST(0.1, LEAST(1.0, (v_overlap_days::DECIMAL / v_total_days::DECIMAL)));
  
  RETURN v_confidence;
END;
$$ LANGUAGE plpgsql;

-- Trigger to detect matches when a job is created
CREATE OR REPLACE FUNCTION trigger_detect_coworker_matches()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for matches on INSERT (not UPDATE/DELETE)
  IF TG_OP = 'INSERT' AND NEW.is_private = false THEN
    PERFORM detect_coworker_matches(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS detect_matches_on_job_insert ON public.jobs;
CREATE TRIGGER detect_matches_on_job_insert
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_detect_coworker_matches();

-- Function to recalculate ALL trust scores (for nightly cron)
CREATE OR REPLACE FUNCTION recalculate_all_trust_scores()
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_user_id IN SELECT id FROM public.profiles
  LOOP
    PERFORM update_trust_score(v_user_id);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_user_id UUID DEFAULT NULL,
  p_related_job_id UUID DEFAULT NULL,
  p_related_connection_id UUID DEFAULT NULL,
  p_related_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message,
    related_user_id, related_job_id,
    related_connection_id, related_reference_id
  )
  VALUES (
    p_user_id, p_type, p_title, p_message,
    p_related_user_id, p_related_job_id,
    p_related_connection_id, p_related_reference_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR NOTIFICATIONS
-- ============================================================================

-- Create notification when connection is confirmed
CREATE OR REPLACE FUNCTION trigger_notify_connection_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Notify the person who initiated the connection
    PERFORM create_notification(
      NEW.initiated_by,
      'connection_confirmed',
      'Connection Confirmed',
      (SELECT full_name FROM public.profiles WHERE id = NEW.connected_user_id) || 
      ' confirmed your connection request.',
      NEW.connected_user_id,
      NULL,
      NEW.id,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_on_connection_confirmed ON public.connections;
CREATE TRIGGER notify_on_connection_confirmed
  AFTER UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_connection_confirmed();

-- Create notification when reference is created
CREATE OR REPLACE FUNCTION trigger_notify_reference_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.to_user_id,
    'reference_received',
    'New Reference Received',
    (SELECT full_name FROM public.profiles WHERE id = NEW.from_user_id) || 
    ' left you a reference.',
    NEW.from_user_id,
    NEW.job_id,
    NULL,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_on_reference_created ON public.references;
CREATE TRIGGER notify_on_reference_created
  AFTER INSERT ON public.references
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_reference_created();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coworker_matches ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Employer purchases: Employers can view their own purchases
CREATE POLICY "Employers can view own purchases"
  ON public.employer_purchases FOR SELECT
  USING (
    auth.uid() = employer_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Coworker matches: Users can view matches they're part of
CREATE POLICY "Users can view own matches"
  ON public.coworker_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================================================
-- UPDATED TRUST SCORE CALCULATION (V2)
-- ============================================================================

-- Enhanced trust score calculation with more factors
CREATE OR REPLACE FUNCTION calculate_trust_score_v2(p_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_job_count INTEGER;
  v_reference_count INTEGER;
  v_avg_rating DECIMAL(3,2);
  v_high_rated_refs INTEGER; -- References with 4+ stars
  v_connection_count INTEGER;
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

  -- Count high-rated references (4+ stars)
  SELECT COUNT(*) INTO v_high_rated_refs
  FROM public.references
  WHERE to_user_id = p_user_id AND is_deleted = false AND rating >= 4;

  -- Count confirmed connections
  SELECT COUNT(*) INTO v_connection_count
  FROM public.connections
  WHERE (user_id = p_user_id OR connected_user_id = p_user_id)
    AND status = 'confirmed';

  -- V2 Calculation: Enhanced formula
  -- Job count: 25% weight (max 25 points, 2 points per job, capped at 12 jobs)
  -- Reference count: 35% weight (max 35 points, 1 point per reference, capped at 35)
  -- Average rating: 25% weight (max 25 points, 5 stars = 25 points)
  -- High-rated refs bonus: 10% weight (max 10 points, 0.5 points per 4+ star ref, capped at 20 refs)
  -- Connection bonus: 5% weight (max 5 points, 0.1 points per connection, capped at 50 connections)
  
  v_score := LEAST(v_job_count * 2, 25) + 
             LEAST(v_reference_count, 35) + 
             (v_avg_rating * 5) +
             LEAST(v_high_rated_refs * 0.5, 10) +
             LEAST(v_connection_count * 0.1, 5);

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Update the main trust score function to use v2
CREATE OR REPLACE FUNCTION update_trust_score(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_score DECIMAL(5,2);
  v_job_count INTEGER;
  v_reference_count INTEGER;
  v_avg_rating DECIMAL(3,2);
BEGIN
  -- Calculate score using v2 formula
  v_score := calculate_trust_score_v2(p_user_id);

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
  INSERT INTO public.trust_scores (user_id, score, job_count, reference_count, average_rating, calculated_at, version)
  VALUES (p_user_id, v_score, v_job_count, v_reference_count, v_avg_rating, NOW(), 'v2')
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    job_count = EXCLUDED.job_count,
    reference_count = EXCLUDED.reference_count,
    average_rating = EXCLUDED.average_rating,
    calculated_at = NOW(),
    version = 'v2';
END;
$$ LANGUAGE plpgsql;
