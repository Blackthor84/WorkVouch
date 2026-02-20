-- activity_log: user-facing activity (action/target). RLS: users read/insert own; admins read all.
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);

COMMENT ON TABLE public.activity_log IS 'User activity for dashboard and timeline; users can read and insert their own.';

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users can select their own rows
DROP POLICY IF EXISTS "Users can select own activity_log" ON public.activity_log;
CREATE POLICY "Users can select own activity_log"
  ON public.activity_log FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own rows
DROP POLICY IF EXISTS "Users can insert own activity_log" ON public.activity_log;
CREATE POLICY "Users can insert own activity_log"
  ON public.activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can select all (for forensics)
DROP POLICY IF EXISTS "Admins can select all activity_log" ON public.activity_log;
CREATE POLICY "Admins can select all activity_log"
  ON public.activity_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
