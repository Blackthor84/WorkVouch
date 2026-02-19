-- View: admin audit log entries with admin email for UI/API.
-- Matches select: id, created_at, action, target_type, target_id, scenario_id, admin_email, metadata.
create or replace view public.admin_audit_log_entries_with_admin_email as
select
  id,
  created_at,
  action_type as action,
  target_type,
  target_id,
  (after_state->>'scenario_id')::uuid as scenario_id,
  admin_email,
  coalesce(after_state, before_state, '{}'::jsonb) as metadata
from public.admin_audit_logs;

comment on view public.admin_audit_log_entries_with_admin_email is
  'Read-only view for admin audit log UI: id, created_at, action, target_type, target_id, scenario_id, admin_email, metadata.';
