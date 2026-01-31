-- Rehire status per employer–candidate pair (internal only; behind rehire_internal flag).

CREATE TABLE IF NOT EXISTS public.employer_candidate_rehire (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rehire_status TEXT NOT NULL DEFAULT 'none',
  rehire_notes TEXT NULL,
  rehire_flag BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_employer_candidate_rehire_employer ON public.employer_candidate_rehire(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_candidate_rehire_candidate ON public.employer_candidate_rehire(candidate_id);
CREATE INDEX IF NOT EXISTS idx_employer_candidate_rehire_flag ON public.employer_candidate_rehire(rehire_flag);

COMMENT ON TABLE public.employer_candidate_rehire IS 'Internal rehire decisions. Behind rehire_internal feature flag.';
