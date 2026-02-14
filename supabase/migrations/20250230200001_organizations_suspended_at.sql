-- ============================================================================
-- organizations.suspended_at — nullable TIMESTAMPTZ for admin soft suspend.
-- Same schema in sandbox and production (full parity).
-- Suspend: set suspended_at = NOW(). Unsuspend: set suspended_at = null.
-- ============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

COMMENT ON COLUMN public.organizations.suspended_at IS 'Admin soft suspend: set by suspend, null by reactivate. Null = active.';
