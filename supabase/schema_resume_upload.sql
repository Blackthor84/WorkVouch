-- ============================================================================
-- RESUME UPLOAD FEATURE - DATABASE SCHEMA
-- ============================================================================
-- Tables for education, skills, and resume storage
-- ============================================================================

-- Education table
CREATE TABLE IF NOT EXISTS public.education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_year INTEGER,
  end_year INTEGER,
  is_current BOOLEAN NOT NULL DEFAULT false,
  gpa DECIMAL(3,2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT, -- e.g., 'technical', 'soft', 'certification'
  proficiency_level TEXT, -- e.g., 'beginner', 'intermediate', 'advanced', 'expert'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- Resume files table (track uploaded resumes)
CREATE TABLE IF NOT EXISTS public.resume_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER NOT NULL, -- in bytes
  file_type TEXT NOT NULL, -- 'pdf' or 'docx'
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add responsibilities column to jobs table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'jobs' 
    AND column_name = 'responsibilities'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN responsibilities TEXT;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_files_user_id ON public.resume_files(user_id);

-- RLS Policies
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_files ENABLE ROW LEVEL SECURITY;

-- Education policies
DROP POLICY IF EXISTS "Users can view their own education" ON public.education;
CREATE POLICY "Users can view their own education" ON public.education
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own education" ON public.education;
CREATE POLICY "Users can insert their own education" ON public.education
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own education" ON public.education;
CREATE POLICY "Users can update their own education" ON public.education
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own education" ON public.education;
CREATE POLICY "Users can delete their own education" ON public.education
  FOR DELETE USING (auth.uid() = user_id);

-- Skills policies
DROP POLICY IF EXISTS "Users can view their own skills" ON public.skills;
CREATE POLICY "Users can view their own skills" ON public.skills
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own skills" ON public.skills;
CREATE POLICY "Users can insert their own skills" ON public.skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own skills" ON public.skills;
CREATE POLICY "Users can update their own skills" ON public.skills
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own skills" ON public.skills;
CREATE POLICY "Users can delete their own skills" ON public.skills
  FOR DELETE USING (auth.uid() = user_id);

-- Resume files policies
DROP POLICY IF EXISTS "Users can view their own resume files" ON public.resume_files;
CREATE POLICY "Users can view their own resume files" ON public.resume_files
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resume files" ON public.resume_files;
CREATE POLICY "Users can insert their own resume files" ON public.resume_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resume files" ON public.resume_files;
CREATE POLICY "Users can delete their own resume files" ON public.resume_files
  FOR DELETE USING (auth.uid() = user_id);
