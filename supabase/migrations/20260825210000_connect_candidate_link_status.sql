-- Phase 1: Unified Employer Candidates — link columns on connect_candidate_map (additive only)

BEGIN;

ALTER TABLE public.connect_candidate_map
  ADD COLUMN IF NOT EXISTS link_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS link_method TEXT,
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linked_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS employer_account_id TEXT,
  ADD COLUMN IF NOT EXISTS external_application_id TEXT,
  ADD COLUMN IF NOT EXISTS external_job_id TEXT;

-- Backfill tenant id from owning connection
UPDATE public.connect_candidate_map m
SET employer_account_id = c.employer_account_id
FROM public.connect_connections c
WHERE c.id = m.connection_id
  AND (m.employer_account_id IS NULL OR m.employer_account_id = '');

-- Backfill link_status for rows already linked to a WorkVouch profile
UPDATE public.connect_candidate_map
SET link_status = 'auto_linked',
    link_method = COALESCE(link_method, 'auto_email')
WHERE workvouch_profile_id IS NOT NULL
  AND link_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_connect_candidate_map_employer_link
  ON public.connect_candidate_map (employer_account_id, link_status);

CREATE INDEX IF NOT EXISTS idx_connect_candidate_map_profile
  ON public.connect_candidate_map (workvouch_profile_id)
  WHERE workvouch_profile_id IS NOT NULL;

COMMENT ON COLUMN public.connect_candidate_map.link_status IS
  'pending | auto_linked | manual_linked | ambiguous | unlinked | external_deleted';

COMMIT;
