-- GDPR-compliant account deletion log. Minimal data: who and when.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'user_initiated'
);

CREATE INDEX IF NOT EXISTS idx_deletion_logs_user_id ON public.deletion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_deleted_at ON public.deletion_logs(deleted_at DESC);

ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only deletion_logs"
  ON public.deletion_logs FOR ALL
  USING (false);

COMMENT ON TABLE public.deletion_logs IS 'GDPR: record of account deletions (user_id, time, source). No PII. Append-only.';
