-- ============================================================================
-- Coworker matches: ensure RLS and SELECT policy so users see matches they're in.
-- Equivalent to: auth.uid() = user_id OR auth.uid() = coworker_id
-- (This table uses user1_id / user2_id.)
-- ============================================================================

-- Ensure RLS is enabled on coworker_matches
ALTER TABLE public.coworker_matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if present (avoid duplicate)
DROP POLICY IF EXISTS "Users can view own matches" ON public.coworker_matches;
DROP POLICY IF EXISTS "Users can view coworker_matches they are part of" ON public.coworker_matches;

-- SELECT: users can see rows where they are user1_id OR user2_id
CREATE POLICY "Users can view own matches"
  ON public.coworker_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

COMMENT ON POLICY "Users can view own matches" ON public.coworker_matches IS
  'Bidirectional: show matches where current user is user1 or user2 (auth.uid() = user1_id OR auth.uid() = user2_id).';
