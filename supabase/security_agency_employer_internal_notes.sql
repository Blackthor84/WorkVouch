-- Security Agency Bundle: employer_internal_notes for internal employer-only notes.
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.employer_internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.employer_accounts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_internal_notes_employer ON public.employer_internal_notes(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_internal_notes_profile ON public.employer_internal_notes(profile_id);

ALTER TABLE public.employer_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access employer_internal_notes"
  ON public.employer_internal_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.employer_internal_notes IS 'Security Agency Bundle: internal notes visible only to employer.';
