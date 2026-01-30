-- Add optional details column for feature flag and other audit events.
-- Run after create_admin_actions_table.sql.

ALTER TABLE public.admin_actions
  ADD COLUMN IF NOT EXISTS details text NULL;

COMMENT ON COLUMN public.admin_actions.impersonated_user_id IS 'For impersonation: target user id; for other actions may be empty.';
