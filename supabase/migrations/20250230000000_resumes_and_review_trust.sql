-- ============================================================================
-- RESUMES TABLE (single source for user/org resume uploads)
-- Review normalization: sentiment + trust_weight on employment_references
-- trust_scores: ensure version + calculated_at for audit
-- ============================================================================

-- 1) RESUMES: id, user_id, organization_id, file_path, parsed_data, status, created_at
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  parsed_data JSONB,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsed', 'failed')),
  parsing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_organization_id ON public.resumes(organization_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON public.resumes(status);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);

COMMENT ON TABLE public.resumes IS 'User and candidate resume uploads; file in storage, parsed_data and status for pipeline.';

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
CREATE POLICY "Users can view own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
CREATE POLICY "Users can insert own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
CREATE POLICY "Users can update own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);

-- Service role / admin for org-scoped resume list (admin tools)
DROP POLICY IF EXISTS "Service role full access resumes" ON public.resumes;
CREATE POLICY "Service role full access resumes" ON public.resumes FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 2) EMPLOYMENT_REFERENCES: add sentiment and trust_weight for immutable snapshot
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employment_references' AND column_name = 'sentiment') THEN
    ALTER TABLE public.employment_references ADD COLUMN sentiment NUMERIC(3,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employment_references' AND column_name = 'trust_weight') THEN
    ALTER TABLE public.employment_references ADD COLUMN trust_weight NUMERIC(5,2) DEFAULT 1.0;
  END IF;
END $$;

COMMENT ON COLUMN public.employment_references.sentiment IS 'Normalized sentiment -1 to 1; derived from comment or rating.';
COMMENT ON COLUMN public.employment_references.trust_weight IS 'Weight applied in trust score; default 1.0.';

-- 3) TRUST_SCORES: ensure calculated_at exists (schema has it)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trust_scores' AND column_name = 'calculated_at') THEN
    ALTER TABLE public.trust_scores ADD COLUMN calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;
