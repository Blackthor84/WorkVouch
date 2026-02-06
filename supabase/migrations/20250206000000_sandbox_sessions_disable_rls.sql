-- ============================================================================
-- SANDBOX SESSIONS: Disable RLS for admin sandbox-v2/sessions (debugging).
-- Table name is sandbox_sessions (not sandbox_v2_sessions).
-- Re-enable before production: ALTER TABLE public.sandbox_sessions ENABLE ROW LEVEL SECURITY;
-- ============================================================================

ALTER TABLE public.sandbox_sessions DISABLE ROW LEVEL SECURITY;
