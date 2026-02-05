-- ============================================================================
-- OPTIONAL: Disable RLS on sandbox tables for local/testing only.
-- Run this ONLY in dev/local if metrics/employer/employee generation is
-- blocked by RLS. Re-enable RLS before deploying to production.
--
-- To re-enable: ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
-- ============================================================================

-- Uncomment below to disable RLS for testing (then re-enable after debugging):

-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.employer_accounts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.employment_records DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.employment_references DISABLE ROW LEVEL SECURITY;

-- No-op: this migration documents the option; uncomment above if needed.
