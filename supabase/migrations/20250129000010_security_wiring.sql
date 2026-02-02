-- ============================================================================
-- SECURITY WIRING: unique constraint, match update via API only, reference RLS
-- ============================================================================

-- 1. Unique constraint on employment_matches (prevent duplicate record+matched_user)
-- Remove any duplicate rows first (keep one per pair), then add constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'employment_matches_record_matched_user_unique'
    AND conrelid = 'public.employment_matches'::regclass
  ) THEN
    DELETE FROM public.employment_matches a
    USING public.employment_matches b
    WHERE a.employment_record_id = b.employment_record_id
      AND a.matched_user_id = b.matched_user_id
      AND a.id > b.id;
    ALTER TABLE public.employment_matches
      ADD CONSTRAINT employment_matches_record_matched_user_unique
      UNIQUE (employment_record_id, matched_user_id);
  END IF;
END $$;

-- 2. Remove user UPDATE on employment_matches — only API (service role) can update match_status
DROP POLICY IF EXISTS "Users can update own employment_matches" ON public.employment_matches;

-- 3. Tighten employment_references INSERT: only allow if match is confirmed
DROP POLICY IF EXISTS "Users can insert employment_references as reviewer" ON public.employment_references;
CREATE POLICY "Users can insert employment_references as reviewer for confirmed match"
  ON public.employment_references FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.employment_matches m
      WHERE m.id = employment_match_id
      AND m.match_status = 'confirmed'
    )
  );

COMMENT ON CONSTRAINT employment_matches_record_matched_user_unique ON public.employment_matches IS 'Prevent duplicate (record, matched_user) pairs.';
