-- ============================================================================
-- HIDDEN CULTURE SYSTEMS (Internal only. Not shown to users or employers.)
-- System 1: job_environment_traits — workplace culture votes per job (employment_record).
-- System 2: peer_workstyle_signals — derived coworker behavior signals (no labels shown).
-- All outputs used probabilistically; everything decays. Feature-flag ready.
-- ============================================================================

-- 1. Job environment traits — rolling aggregates per job (no user attribution)
-- job_id = employment_records.id (one role at one company)
CREATE TABLE IF NOT EXISTS public.job_environment_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.employment_records(id) ON DELETE CASCADE,
  trait_key TEXT NOT NULL,
  weighted_score NUMERIC(12,4) NOT NULL DEFAULT 0,
  vote_count INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, trait_key)
);

CREATE INDEX IF NOT EXISTS idx_job_environment_traits_job_id ON public.job_environment_traits(job_id);
CREATE INDEX IF NOT EXISTS idx_job_environment_traits_trait_key ON public.job_environment_traits(trait_key);
CREATE INDEX IF NOT EXISTS idx_job_environment_traits_last_updated ON public.job_environment_traits(last_updated DESC);

COMMENT ON TABLE public.job_environment_traits IS 'Internal. Rolling aggregates of workplace culture votes per job. No user attribution. Not shown to users or employers.';
COMMENT ON COLUMN public.job_environment_traits.job_id IS 'References employment_records.id (one role at one company).';
COMMENT ON COLUMN public.job_environment_traits.trait_key IS 'Locked enum: FAST_PACED, STEADY_PACED, etc.';
COMMENT ON COLUMN public.job_environment_traits.weighted_score IS 'Sum of vote weights (trust-based) with time decay applied on read.';

ALTER TABLE public.job_environment_traits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only job_environment_traits" ON public.job_environment_traits;
CREATE POLICY "Service role only job_environment_traits" ON public.job_environment_traits FOR ALL USING (false);

-- 2. Peer workstyle signals — derived coworker behavior (never displayed as labels)
CREATE TABLE IF NOT EXISTS public.peer_workstyle_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signal_key TEXT NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  observation_count INT NOT NULL DEFAULT 0,
  last_observed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, signal_key)
);

CREATE INDEX IF NOT EXISTS idx_peer_workstyle_signals_user_id ON public.peer_workstyle_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_workstyle_signals_signal_key ON public.peer_workstyle_signals(signal_key);
CREATE INDEX IF NOT EXISTS idx_peer_workstyle_signals_last_observed ON public.peer_workstyle_signals(last_observed DESC);

COMMENT ON TABLE public.peer_workstyle_signals IS 'Internal. Derived workstyle signals for matching/trust. No labels shown. Signals decay over time.';
COMMENT ON COLUMN public.peer_workstyle_signals.signal_key IS 'Locked enum: CONSISTENT_ATTENDANCE, LOW_FRICTION, etc.';
COMMENT ON COLUMN public.peer_workstyle_signals.confidence_score IS '0-1; pattern-based. Conflicting signals reduce confidence.';

ALTER TABLE public.peer_workstyle_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only peer_workstyle_signals" ON public.peer_workstyle_signals;
CREATE POLICY "Service role only peer_workstyle_signals" ON public.peer_workstyle_signals FOR ALL USING (false);
