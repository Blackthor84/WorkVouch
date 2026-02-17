-- Remove invite-only employer signup: drop employer_invites table.
-- Employers can sign up freely like workers (main signup / select-role).
-- ============================================================================

DROP TABLE IF EXISTS public.employer_invites;
