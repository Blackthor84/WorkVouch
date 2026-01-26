-- ============================================================================
-- Employee Reviews Table
-- ============================================================================
-- Creates a table for anonymous employee reviews of employers
-- Supports both anonymous and verified reviews
-- ============================================================================

-- Note: This references employer_accounts table. If you have an 'employers' table instead,
-- change the foreign key reference below to: REFERENCES public.employers(id)

-- Create employee_reviews table
CREATE TABLE IF NOT EXISTS public.employee_reviews (
  id BIGSERIAL PRIMARY KEY,
  employer_id UUID NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint (choose one based on your schema):
-- Option 1: If you have employer_accounts table:
-- ALTER TABLE public.employee_reviews 
--   ADD CONSTRAINT employee_reviews_employer_id_fkey 
--   FOREIGN KEY (employer_id) REFERENCES public.employer_accounts(id) ON DELETE CASCADE;

-- Option 2: If you have employers table:
-- ALTER TABLE public.employee_reviews 
--   ADD CONSTRAINT employee_reviews_employer_id_fkey 
--   FOREIGN KEY (employer_id) REFERENCES public.employers(id) ON DELETE CASCADE;

-- Option 3: If employers are just profiles with employer role, reference profiles:
-- ALTER TABLE public.employee_reviews 
--   ADD CONSTRAINT employee_reviews_employer_id_fkey 
--   FOREIGN KEY (employer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS employee_reviews_employer_id_idx 
  ON public.employee_reviews(employer_id);
CREATE INDEX IF NOT EXISTS employee_reviews_reviewer_id_idx 
  ON public.employee_reviews(reviewer_id) WHERE reviewer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS employee_reviews_created_at_idx 
  ON public.employee_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS employee_reviews_rating_idx 
  ON public.employee_reviews(rating);

-- Enable Row Level Security
ALTER TABLE public.employee_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view reviews (public read access)
CREATE POLICY "Anyone can view reviews" ON public.employee_reviews
  FOR SELECT USING (true);

-- Anyone can create reviews (anonymous reviews allowed)
CREATE POLICY "Anyone can create reviews" ON public.employee_reviews
  FOR INSERT WITH CHECK (true);

-- Reviewers can update their own reviews (if reviewer_id is set)
CREATE POLICY "Reviewers can update own reviews" ON public.employee_reviews
  FOR UPDATE USING (
    reviewer_id IS NOT NULL 
    AND reviewer_id = auth.uid()
  );

-- Reviewers can delete their own reviews (if reviewer_id is set)
CREATE POLICY "Reviewers can delete own reviews" ON public.employee_reviews
  FOR DELETE USING (
    reviewer_id IS NOT NULL 
    AND reviewer_id = auth.uid()
  );

-- Admins can delete any review
CREATE POLICY "Admins can delete any review" ON public.employee_reviews
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER employee_reviews_updated_at_trigger
  BEFORE UPDATE ON public.employee_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_reviews_updated_at();

-- Function to calculate average rating for an employer
CREATE OR REPLACE FUNCTION get_employer_avg_rating(p_employer_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)
    FROM public.employee_reviews
    WHERE employer_id = p_employer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get review count for an employer
CREATE OR REPLACE FUNCTION get_employer_review_count(p_employer_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.employee_reviews
    WHERE employer_id = p_employer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
