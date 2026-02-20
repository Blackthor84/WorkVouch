-- RLS for sandbox_events: admin/superadmin read only. Inserts via service role.
-- Ensure profiles has user_id for policy (same as id); then admin read policy uses profiles.user_id so it compiles.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_id UUID GENERATED ALWAYS AS (id) STORED;
  END IF;
END $$;

ALTER TABLE public.sandbox_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select sandbox_events" ON public.sandbox_events;
CREATE POLICY "Admins can select sandbox_events"
  ON public.sandbox_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
