-- Enterprise-Grade Email Change Security
-- Two-step verification flow; no direct email overwrite.

-- 1) email_change_requests: pending verification
CREATE TABLE IF NOT EXISTS public.email_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_email text NOT NULL,
  new_email text NOT NULL,
  verification_token text NOT NULL,
  verified_at timestamptz,
  requested_ip text,
  requested_user_agent text,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_change_requests_user_id ON public.email_change_requests(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_change_requests_verification_token ON public.email_change_requests(verification_token) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_change_requests_expires_at ON public.email_change_requests(expires_at) WHERE status = 'pending';

COMMENT ON TABLE public.email_change_requests IS 'Pending email change requests; token must be confirmed within 24h.';

ALTER TABLE public.email_change_requests ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (backend) can access; RLS bypass for service_role.

-- 2) email_change_history: immutable log for Settings display
CREATE TABLE IF NOT EXISTS public.email_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_email text NOT NULL,
  new_email text NOT NULL,
  changed_by text NOT NULL CHECK (changed_by IN ('self', 'admin')),
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_change_history_user_id ON public.email_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_change_history_created_at ON public.email_change_history(created_at DESC);

COMMENT ON TABLE public.email_change_history IS 'Immutable log of completed email changes for user-visible history.';

ALTER TABLE public.email_change_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own email_change_history" ON public.email_change_history;
CREATE POLICY "Users can read own email_change_history"
  ON public.email_change_history FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT policy: only service role (backend) can insert; RLS bypass for service role.

-- 3) system_audit_logs: security events (email change request/confirm/revoke, etc.)
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_audit_logs_event_type ON public.system_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_user_id ON public.system_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at ON public.system_audit_logs(created_at DESC);

COMMENT ON TABLE public.system_audit_logs IS 'Security and system events; email change request/confirm/revoke.';

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select system_audit_logs" ON public.system_audit_logs;
CREATE POLICY "Admins can select system_audit_logs"
  ON public.system_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin')
    )
  );

-- No INSERT policy: only service role can insert.
