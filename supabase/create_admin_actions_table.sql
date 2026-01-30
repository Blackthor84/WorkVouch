-- Optional: log admin impersonation for audit (run in Supabase SQL editor if desired)
-- When you scale, this matters.

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL,
  impersonated_user_id text NOT NULL,
  action_type text NOT NULL DEFAULT 'impersonate',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: RLS so only service role can insert (no public read)
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert admin_actions"
  ON public.admin_actions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select admin_actions"
  ON public.admin_actions
  FOR SELECT
  TO service_role
  USING (true);

COMMENT ON TABLE public.admin_actions IS 'Audit log for admin impersonation and other admin actions';
